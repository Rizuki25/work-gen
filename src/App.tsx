import { useEffect, useMemo, useState } from 'react'
import { GeneratorPanel } from './features/generators/GeneratorPanel'
import { SettingsPanel } from './features/settings/SettingsPanel'
import { generateWithAi } from './modules/ai/ai-service'
import { createDefaultRegistry } from './modules/built-in'
import type { GeneratorAiRuntime } from './modules/contracts'
import {
  createDefaultAppSettings,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from './modules/settings/app-settings'
import {
  createMemorySecretStore,
  createProviderConfig,
  loadProviderConfigs,
  saveProviderConfigs,
  validateProviderDraft,
  type ProviderConfig,
  type ProviderDraft,
} from './modules/providers/provider-store'
import {
  testProviderConnection,
  type ProviderTestConnectionResult,
} from './modules/providers/openai-compatible-adapter'

const categories = [
  {
    label: 'Local',
    description: 'Utilitas yang berjalan langsung di perangkat.',
    status: '12 generator aktif',
  },
  {
    label: 'Template',
    description: 'Dokumen kerja konsisten dari form sederhana.',
    status: '6 template aktif',
  },
  {
    label: 'AI',
    description: 'Bantuan opsional dengan provider pilihan Anda.',
    status: '1 generator aktif',
  },
]

const sidebarGroups = [
  { label: 'Text & Format', description: 'Teks dan struktur data' },
  { label: 'Data & Conversion', description: 'Konversi format lokal' },
  { label: 'Security & Random', description: 'Data sensitif dan random' },
  { label: 'Reports', description: 'Template kerja terstruktur' },
  { label: 'Documents', description: 'Prosedur dan dokumen kerja' },
  { label: 'AI', description: 'Bantuan opsional dengan provider' },
]

const registry = createDefaultRegistry()
const localGenerators = registry.list({ kind: 'local' })
const templateGenerators = registry.list({ kind: 'template' })
const aiGenerators = registry.list({ kind: 'ai' })
const availableGenerators = [...localGenerators, ...templateGenerators, ...aiGenerators]

function getDefaultLocalGenerator() {
  const generator = localGenerators[0]

  if (!generator) {
    throw new Error('Default registry tidak memuat Local Generator.')
  }

  return generator
}

const defaultLocalGenerator = getDefaultLocalGenerator()
const providerSecretStore = createMemorySecretStore()
type AppView = 'home' | 'generator' | 'settings'

function App() {
  const [activeView, setActiveView] = useState<AppView>('home')
  const [selectedGeneratorId, setSelectedGeneratorId] = useState(
    defaultLocalGenerator.definition.id,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings())
  const [providers, setProviders] = useState<ProviderConfig[]>(() => loadProviderConfigs())
  const [systemPrefersLight, setSystemPrefersLight] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches,
  )

  const selectedGenerator =
    availableGenerators.find((generator) => generator.definition.id === selectedGeneratorId) ??
    defaultLocalGenerator
  const isHome = activeView === 'home'
  const isSettings = activeView === 'settings'
  const resolvedTheme =
    settings.theme === 'system' ? (systemPrefersLight ? 'light' : 'dark') : settings.theme
  const selectedAiProvider = providers.find((provider) => provider.id === settings.defaultProviderId) ??
    providers.find((provider) => provider.isDefault)
  const aiRuntime: GeneratorAiRuntime = {
    provider: selectedAiProvider,
    generate: (request) => generateWithAi({
      ...request,
      provider: selectedAiProvider,
      apiKey: selectedAiProvider
        ? providerSecretStore.get(selectedAiProvider.apiKeyRef)
        : undefined,
    }, { isOnline }),
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    saveAppSettings(settings)
  }, [settings])

  useEffect(() => {
    saveProviderConfigs(providers)
  }, [providers])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleThemeChange = (event: MediaQueryListEvent) => setSystemPrefersLight(event.matches)

    setSystemPrefersLight(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleThemeChange)

    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, [])

  const filteredGenerators = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) {
      return availableGenerators
    }

    return availableGenerators.filter(({ definition }) =>
      [definition.name, definition.description, definition.category, ...definition.tags]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [searchQuery])

  function handleSelectGenerator(generatorId: string) {
    setSelectedGeneratorId(generatorId)
    setActiveView('generator')
    setSidebarOpen(false)
  }

  function handleHome() {
    setActiveView('home')
    setSidebarOpen(false)
  }

  function handleSettings() {
    setActiveView('settings')
    setSidebarOpen(false)
  }

  function handleResetSettings() {
    if (!window.confirm('Reset semua preferensi dan provider WorkGen? File output Anda tidak akan dihapus.')) {
      return
    }

    setSettings(createDefaultAppSettings())
    setProviders([])
    providerSecretStore.clear()
  }

  function handleSaveProvider(draft: ProviderDraft) {
    const existing = providers.find((provider) => provider.id === draft.id)
    const requireApiKey = existing ? !providerSecretStore.has(existing.apiKeyRef) : true
    const validation = validateProviderDraft(draft, { requireApiKey })

    if (!validation.valid) {
      return
    }

    const isDefault = existing?.isDefault === true ||
      (existing === undefined && (providers.length === 0 || settings.defaultProviderId === null))
    const provider = createProviderConfig(draft, existing, new Date(), isDefault)

    if (draft.apiKey.trim().length > 0) {
      providerSecretStore.set(provider.apiKeyRef, draft.apiKey)
    }

    setProviders((currentProviders) => {
      const nextProviders = currentProviders.some((item) => item.id === provider.id)
        ? currentProviders.map((item) => item.id === provider.id ? provider : item)
        : [...currentProviders, provider]

      return nextProviders.map((item) => ({
        ...item,
        isDefault: provider.isDefault ? item.id === provider.id : item.isDefault,
      }))
    })

    if (isDefault) {
      setSettings((currentSettings) => ({
        ...currentSettings,
        defaultProviderId: provider.id,
      }))
    }
  }

  function handleDeleteProvider(providerId: string) {
    const provider = providers.find((item) => item.id === providerId)
    if (!provider || !window.confirm(`Hapus konfigurasi provider "${provider.displayName}"?`)) {
      return
    }

    providerSecretStore.delete(provider.apiKeyRef)
    const remainingProviders = providers.filter((item) => item.id !== providerId)
    const nextDefaultId = provider.isDefault ? remainingProviders[0]?.id ?? null : settings.defaultProviderId

    setProviders(remainingProviders.map((item, index) => ({
      ...item,
      isDefault: nextDefaultId === item.id || (nextDefaultId === null && index === 0),
    })))
    setSettings((currentSettings) => ({
      ...currentSettings,
      defaultProviderId: nextDefaultId,
    }))
  }

  function handleSetDefaultProvider(providerId: string) {
    setProviders((currentProviders) => currentProviders.map((provider) => ({
      ...provider,
      isDefault: provider.id === providerId,
    })))
    setSettings((currentSettings) => ({
      ...currentSettings,
      defaultProviderId: providerId,
    }))
  }

  async function handleTestProviderConnection(
    draft: ProviderDraft,
  ): Promise<ProviderTestConnectionResult> {
    const existing = providers.find((provider) => provider.id === draft.id)
    const apiKey = draft.apiKey.trim().length > 0
      ? draft.apiKey
      : existing
        ? providerSecretStore.get(existing.apiKeyRef)
        : undefined
    const provider = createProviderConfig(
      draft,
      existing,
      new Date(),
      existing?.isDefault ?? false,
    )

    return testProviderConnection(provider, apiKey, { isOnline })
  }

  return (
    <main className="app-shell" data-theme={resolvedTheme}>
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <a className="brand" href="/" aria-label="WorkGen home">
            <span className="brand-mark">W</span>
            <span className="brand-copy">
              <strong>WorkGen</strong>
              <small>local tools</small>
            </span>
          </a>
        </div>

        <div className="sidebar-search">
          <span className="search-symbol" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            autoComplete="off"
          />
        </div>

        <nav className="sidebar-nav" aria-label="Generator menu">
          <button
            className={`sidebar-home ${isHome ? 'active' : ''}`}
            type="button"
            onClick={handleHome}
            aria-current={isHome ? 'page' : undefined}
          >
            <span className="sidebar-tool-icon" aria-hidden="true">
              ⌂
            </span>
            <span>Home</span>
          </button>

          <button
            className={`sidebar-home sidebar-settings ${isSettings ? 'active' : ''}`}
            type="button"
            onClick={handleSettings}
            aria-current={isSettings ? 'page' : undefined}
          >
            <span className="sidebar-tool-icon" aria-hidden="true">
              S
            </span>
            <span>Settings</span>
          </button>

          {sidebarGroups.map((group) => {
            const tools = filteredGenerators.filter(
              (generator) => generator.definition.category === group.label,
            )

            if (tools.length === 0) {
              return null
            }

            return (
              <section className="sidebar-group" key={group.label}>
                <div className="sidebar-group-heading">
                  <h2>{group.label}</h2>
                  <span>{group.description}</span>
                </div>
                <div className="sidebar-tool-list">
                  {tools.map((generator) => {
                    const isSelected =
                      activeView === 'generator' &&
                      generator.definition.id === selectedGenerator.definition.id

                    return (
                      <button
                        className={`sidebar-tool ${isSelected ? 'is-selected' : ''}`}
                        type="button"
                        key={generator.definition.id}
                        onClick={() => handleSelectGenerator(generator.definition.id)}
                        title={generator.definition.name}
                      >
                        <span className="sidebar-tool-icon" aria-hidden="true">
                          {generator.definition.icon ?? '•'}
                        </span>
                        <span className="sidebar-tool-name">{generator.definition.name}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {filteredGenerators.length === 0 && (
            <p className="sidebar-empty">Tidak ada tool yang cocok dengan pencarian.</p>
          )}
        </nav>

        <footer className="sidebar-footer">
          <span className="sidebar-footer-status">
            <span className={`status-dot ${isOnline ? '' : 'is-offline'}`} aria-hidden="true" />
            {isOnline ? 'Online · Local-first' : 'Offline · Local-ready'}
          </span>
          <span>{localGenerators.length} local tools available</span>
        </footer>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <section className="main-area">
        <header className="content-header">
          <button
            className="menu-button"
            type="button"
            aria-label="Buka menu generator"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((isOpen) => !isOpen)}
          >
            ☰
          </button>
          <div className="page-title">
            <span className="page-title-icon" aria-hidden="true">
              {isSettings ? 'S' : isHome ? '⌂' : selectedGenerator.definition.icon ?? '•'}
            </span>
            <span>{isSettings ? 'Settings' : isHome ? 'Home' : selectedGenerator.definition.name}</span>
          </div>
          <span className="header-status">
            <span className={`status-dot ${isOnline ? '' : 'is-offline'}`} aria-hidden="true" />
            {isOnline ? 'Online · Local-first' : 'Offline · Local tools available'}
          </span>
        </header>

        <div className="content-scroll">
          {isHome ? (
            <>
              <section className="hero" aria-labelledby="welcome-title">
                <div className="hero-meta">
                  <span>WORKGEN / HOME</span>
                  <span>NO LOGIN · NO TRACKING</span>
                </div>
                <p className="eyebrow">Kotak alat kerja pribadi</p>
                <h1 id="welcome-title">Selesaikan pekerjaan rutin dengan lebih tenang.</h1>
                <p className="hero-copy">
                  WorkGen adalah kumpulan tools kecil yang cepat, privat, dan tetap berguna tanpa
                  koneksi internet.
                </p>
                <div className="hero-points" aria-label="WorkGen principles">
                  <span>Local by default</span>
                  <span>Output milik Anda</span>
                  <span>AI tetap opsional</span>
                </div>
              </section>

              <section className="category-grid" aria-label="Kategori generator">
                {categories.map((category) => (
                  <article className="category-card" key={category.label}>
                    <div className="card-heading">
                      <span className="card-icon" aria-hidden="true">
                        {category.label.slice(0, 1)}
                      </span>
                      <span className="card-status">{category.status}</span>
                    </div>
                    <h2>{category.label}</h2>
                    <p>{category.description}</p>
                  </article>
                ))}
              </section>
            </>
          ) : isSettings ? (
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onReset={handleResetSettings}
              providers={providers}
              onSaveProvider={handleSaveProvider}
              onDeleteProvider={handleDeleteProvider}
              onSetDefaultProvider={handleSetDefaultProvider}
              onTestProviderConnection={handleTestProviderConnection}
              hasProviderApiKey={(apiKeyRef) => providerSecretStore.has(apiKeyRef)}
            />
          ) : (
            <div className="feature-view">
              <div className="feature-breadcrumb" aria-label="Lokasi generator">
                <span>{selectedGenerator.definition.kind === 'template' ? 'Template' : 'Local'}</span>
                <span aria-hidden="true">/</span>
                <span>{selectedGenerator.definition.category}</span>
              </div>
              <GeneratorPanel
                key={selectedGenerator.definition.id}
                generator={selectedGenerator}
                aiRuntime={aiRuntime}
              />
            </div>
          )}

          <footer className="footer-note">
              <span>
                {isHome ? 'Fondasi proyek M2.5' : isSettings ? 'Settings' : selectedGenerator.definition.name}
              </span>
            <span aria-hidden="true">•</span>
            <span>
              {selectedGenerator.definition.kind === 'ai'
                ? 'AI mengirim data hanya setelah consent'
                : 'Local dan Template tidak mengirim data ke network'}
            </span>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default App
