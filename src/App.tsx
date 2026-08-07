import { useMemo, useState } from 'react'
import { GeneratorPanel } from './features/generators/GeneratorPanel'
import { createDefaultRegistry } from './modules/built-in'

const categories = [
  {
    label: 'Local',
    description: 'Utilitas yang berjalan langsung di perangkat.',
    status: '5 generator aktif',
  },
  {
    label: 'Template',
    description: 'Dokumen kerja konsisten dari form sederhana.',
    status: 'Segera hadir',
  },
  {
    label: 'AI',
    description: 'Bantuan opsional dengan provider pilihan Anda.',
    status: 'Segera hadir',
  },
]

const sidebarGroups = [
  { label: 'Text & Format', description: 'Teks dan struktur data' },
  { label: 'Data & Conversion', description: 'Konversi format lokal' },
  { label: 'Security & Random', description: 'Data sensitif dan random' },
]

const registry = createDefaultRegistry()
const localGenerators = registry.list({ kind: 'local' })

function getDefaultLocalGenerator() {
  const generator = localGenerators[0]

  if (!generator) {
    throw new Error('Default registry tidak memuat Local Generator.')
  }

  return generator
}

const defaultLocalGenerator = getDefaultLocalGenerator()
type AppView = 'home' | 'generator'

function App() {
  const [activeView, setActiveView] = useState<AppView>('home')
  const [selectedGeneratorId, setSelectedGeneratorId] = useState(
    defaultLocalGenerator.definition.id,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const selectedGenerator =
    localGenerators.find((generator) => generator.definition.id === selectedGeneratorId) ??
    defaultLocalGenerator
  const isHome = activeView === 'home'

  const filteredGenerators = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) {
      return localGenerators
    }

    return localGenerators.filter(({ definition }) =>
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

  return (
    <main className="app-shell">
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
                      !isHome && generator.definition.id === selectedGenerator.definition.id

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
            <span className="status-dot" aria-hidden="true" />
            Offline-ready
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
              {isHome ? '⌂' : selectedGenerator.definition.icon ?? '•'}
            </span>
            <span>{isHome ? 'Home' : selectedGenerator.definition.name}</span>
          </div>
          <span className="header-status">
            <span className="status-dot" aria-hidden="true" />
            Local-first
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
          ) : (
            <div className="feature-view">
              <div className="feature-breadcrumb" aria-label="Lokasi generator">
                <span>Local</span>
                <span aria-hidden="true">/</span>
                <span>{selectedGenerator.definition.category}</span>
              </div>
              <GeneratorPanel key={selectedGenerator.definition.id} generator={selectedGenerator} />
            </div>
          )}

          <footer className="footer-note">
            <span>{isHome ? 'Fondasi proyek M0.8' : selectedGenerator.definition.name}</span>
            <span aria-hidden="true">•</span>
            <span>Generator lokal tidak mengirim data ke network</span>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default App
