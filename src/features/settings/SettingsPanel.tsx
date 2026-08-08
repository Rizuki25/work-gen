import type { AppSettings, AppTheme, DefaultOutputFormat } from '../../modules/settings/app-settings'
import type { ProviderTestConnectionResult } from '../../modules/providers/openai-compatible-adapter'
import { ProviderSettings } from './ProviderSettings'
import type { ProviderConfig, ProviderDraft } from '../../modules/providers/provider-store'

interface SettingsPanelProps {
  readonly settings: AppSettings
  readonly onChange: (settings: AppSettings) => void
  readonly onReset: () => void
  readonly providers: readonly ProviderConfig[]
  readonly onSaveProvider: (draft: ProviderDraft) => void
  readonly onDeleteProvider: (providerId: string) => void
  readonly onSetDefaultProvider: (providerId: string) => void
  readonly onTestProviderConnection: (draft: ProviderDraft) => Promise<ProviderTestConnectionResult>
  readonly hasProviderApiKey: (apiKeyRef: string) => boolean
}

export function SettingsPanel({
  settings,
  onChange,
  onReset,
  providers,
  onSaveProvider,
  onDeleteProvider,
  onSetDefaultProvider,
  onTestProviderConnection,
  hasProviderApiKey,
}: SettingsPanelProps) {
  function updateSetting<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
    onChange({ ...settings, [key]: value })
  }

  return (
    <section className="settings-view" aria-labelledby="settings-title">
      <div className="settings-intro">
        <p className="section-kicker">Preferences</p>
        <h1 id="settings-title">Settings</h1>
        <p>
          Preferensi ini tersimpan di perangkat Anda. WorkGen tetap dapat digunakan tanpa login
          atau koneksi internet.
        </p>
      </div>

      <div className="settings-grid">
        <section className="settings-card" aria-labelledby="appearance-title">
          <div className="settings-card-heading">
            <div>
              <p className="section-kicker">Appearance</p>
              <h2 id="appearance-title">Tampilan</h2>
            </div>
            <span className="settings-card-icon" aria-hidden="true">A</span>
          </div>
          <label className="settings-field" htmlFor="settings-theme">
            <span>Theme</span>
            <select
              id="settings-theme"
              value={settings.theme}
              onChange={(event) => updateSetting('theme', event.target.value as AppTheme)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
            <small>Theme diterapkan langsung pada shell WorkGen.</small>
          </label>
          <label className="settings-field" htmlFor="settings-output-format">
            <span>Default output format</span>
            <select
              id="settings-output-format"
              value={settings.defaultOutputFormat}
              onChange={(event) =>
                updateSetting('defaultOutputFormat', event.target.value as DefaultOutputFormat)
              }
            >
              <option value="plain-text">Plain text</option>
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <small>Preferensi ini akan digunakan Template Generator berikutnya.</small>
          </label>
        </section>

        <section className="settings-card" aria-labelledby="privacy-title">
          <div className="settings-card-heading">
            <div>
              <p className="section-kicker">Privacy &amp; Data</p>
              <h2 id="privacy-title">Data lokal</h2>
            </div>
            <span className="settings-card-icon" aria-hidden="true">P</span>
          </div>
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={settings.historyEnabled}
              onChange={(event) => updateSetting('historyEnabled', event.target.checked)}
            />
            <span>
              <strong>Aktifkan history lokal</strong>
              <small>Pengaturan disiapkan untuk history generator yang akan datang.</small>
            </span>
          </label>
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={settings.saveAiContentToHistory}
              disabled={!settings.historyEnabled}
              onChange={(event) => updateSetting('saveAiContentToHistory', event.target.checked)}
            />
            <span>
              <strong>Simpan konten AI ke history</strong>
              <small>Default mati agar konten AI tidak disimpan tanpa keputusan Anda.</small>
            </span>
          </label>
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={settings.showAiDataBoundaryNotice}
              onChange={(event) => updateSetting('showAiDataBoundaryNotice', event.target.checked)}
            />
            <span>
              <strong>Tampilkan notice data boundary AI</strong>
              <small>AI belum aktif; notice ini akan digunakan saat provider tersedia.</small>
            </span>
          </label>
        </section>

        <section className="settings-card settings-card-wide" aria-labelledby="provider-title">
          <div className="settings-card-heading">
            <div>
              <p className="section-kicker">AI Providers</p>
              <h2 id="provider-title">Provider pilihan Anda</h2>
            </div>
            <span className="module-badge">Foundation</span>
          </div>
          <ProviderSettings
            providers={providers}
            onSave={onSaveProvider}
            onDelete={onDeleteProvider}
            onSetDefault={onSetDefaultProvider}
            onTestConnection={onTestProviderConnection}
            hasApiKey={hasProviderApiKey}
          />
        </section>
      </div>

      <div className="settings-actions">
        <button className="secondary-button" type="button" onClick={onReset}>
          Reset settings
        </button>
        <span>Perubahan tersimpan otomatis di perangkat ini.</span>
      </div>
    </section>
  )
}
