import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { ProviderTestConnectionResult } from '../../modules/providers/openai-compatible-adapter'
import {
  validateProviderDraft,
  type ProviderConfig,
  type ProviderDraft,
  type ProviderValidationIssue,
} from '../../modules/providers/provider-store'

interface ProviderSettingsProps {
  readonly providers: readonly ProviderConfig[]
  readonly onSave: (draft: ProviderDraft) => void
  readonly onDelete: (providerId: string) => void
  readonly onSetDefault: (providerId: string) => void
  readonly onTestConnection: (draft: ProviderDraft) => Promise<ProviderTestConnectionResult>
  readonly hasApiKey: (apiKeyRef: string) => boolean
}

function createEmptyDraft(): ProviderDraft {
  return {
    displayName: '',
    type: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: '',
    apiKey: '',
    timeoutMs: 60000,
    maxOutputTokens: 2048,
    temperature: 0.3,
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Tanggal tidak diketahui' : date.toLocaleDateString('id-ID')
}

export function ProviderSettings({
  providers,
  onSave,
  onDelete,
  onSetDefault,
  onTestConnection,
  hasApiKey,
}: ProviderSettingsProps) {
  const [draft, setDraft] = useState<ProviderDraft>(() => createEmptyDraft())
  const [editingProviderId, setEditingProviderId] = useState<string | undefined>()
  const [issues, setIssues] = useState<readonly ProviderValidationIssue[]>([])
  const [message, setMessage] = useState<string | undefined>()
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<ProviderTestConnectionResult | undefined>()

  const editingProvider = providers.find((provider) => provider.id === editingProviderId)
  const apiKeyRequired = editingProvider ? !hasApiKey(editingProvider.apiKeyRef) : true

  function updateDraft<Key extends keyof ProviderDraft>(key: Key, value: ProviderDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setIssues([])
    setMessage(undefined)
    setTestResult(undefined)
  }

  function handleNumberChange(
    key: 'timeoutMs' | 'maxOutputTokens' | 'temperature',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = event.target.value.trim() === '' ? Number.NaN : Number(event.target.value)
    updateDraft(key, value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = validateProviderDraft(draft, { requireApiKey: apiKeyRequired })
    if (!validation.valid) {
      setIssues(validation.issues)
      setMessage(undefined)
      return
    }

    onSave(draft)
    setDraft(createEmptyDraft())
    setEditingProviderId(undefined)
    setIssues([])
    setMessage(editingProvider ? 'Provider berhasil diperbarui.' : 'Provider berhasil ditambahkan.')
    setTestResult(undefined)
  }

  async function handleTestConnection() {
    const validation = validateProviderDraft(draft, { requireApiKey: apiKeyRequired })
    if (!validation.valid) {
      setIssues(validation.issues)
      setMessage(undefined)
      setTestResult(undefined)
      return
    }

    setIsTesting(true)
    setIssues([])
    setMessage(undefined)

    try {
      setTestResult(await onTestConnection(draft))
    } catch {
      setTestResult({
        status: 'failed',
        error: {
          code: 'network',
          userMessage: 'Koneksi aman ke provider gagal.',
          retryable: true,
        },
      })
    } finally {
      setIsTesting(false)
    }
  }

  function handleEdit(provider: ProviderConfig) {
    setDraft({
      id: provider.id,
      displayName: provider.displayName,
      type: provider.type,
      baseUrl: provider.baseUrl,
      model: provider.model,
      apiKey: '',
      timeoutMs: provider.timeoutMs,
      maxOutputTokens: provider.maxOutputTokens,
      temperature: provider.temperature,
    })
    setEditingProviderId(provider.id)
    setIssues([])
    setMessage(undefined)
    setTestResult(undefined)
  }

  function handleCancelEdit() {
    setDraft(createEmptyDraft())
    setEditingProviderId(undefined)
    setIssues([])
    setMessage(undefined)
    setTestResult(undefined)
  }

  function issueFor(fieldId: string): ProviderValidationIssue | undefined {
    return issues.find((issue) => issue.fieldId === fieldId)
  }

  function renderIssue(fieldId: string) {
    const issue = issueFor(fieldId)
    return issue ? <span className="field-error">{issue.message}</span> : null
  }

  return (
    <div className="provider-settings">
      <div className="provider-security-note">
        <strong>API key tidak disimpan di localStorage atau history.</strong>
        <span>
          Pada versi web ini, secret hanya berada di memori sesi browser. Metadata provider tetap
          dapat disimpan lokal tanpa nilai API key.
        </span>
      </div>

      <form className="provider-form" onSubmit={handleSubmit}>
        <div className="provider-form-heading">
          <div>
            <h3>{editingProvider ? 'Edit provider' : 'Tambah provider'}</h3>
            <p>OpenAI-compatible dengan Base URL yang dapat Anda pilih.</p>
          </div>
          {editingProvider && (
            <button className="secondary-button" type="button" onClick={handleCancelEdit}>
              Batal edit
            </button>
          )}
        </div>

        <div className="provider-form-grid">
          <label className="settings-field" htmlFor="provider-display-name">
            <span>Nama konfigurasi</span>
            <input
              id="provider-display-name"
              type="text"
              value={draft.displayName}
              onChange={(event) => updateDraft('displayName', event.target.value)}
              placeholder="OpenAI pribadi"
              autoComplete="off"
            />
            {renderIssue('displayName')}
          </label>

          <label className="settings-field" htmlFor="provider-model">
            <span>Model</span>
            <input
              id="provider-model"
              type="text"
              value={draft.model}
              onChange={(event) => updateDraft('model', event.target.value)}
              placeholder="gpt-4o-mini"
              autoComplete="off"
            />
            {renderIssue('model')}
          </label>

          <label className="settings-field provider-form-wide" htmlFor="provider-base-url">
            <span>Base URL</span>
            <input
              id="provider-base-url"
              type="url"
              value={draft.baseUrl}
              onChange={(event) => updateDraft('baseUrl', event.target.value)}
              placeholder="https://api.example.com/v1"
              autoComplete="url"
            />
            <small>Gunakan HTTPS untuk provider remote. HTTP hanya untuk gateway lokal yang Anda kenal.</small>
            {renderIssue('baseUrl')}
          </label>

          <label className="settings-field provider-form-wide" htmlFor="provider-api-key">
            <span>API key {apiKeyRequired ? '' : '(kosongkan jika tidak berubah)'}</span>
            <input
              id="provider-api-key"
              type="password"
              value={draft.apiKey}
              onChange={(event) => updateDraft('apiKey', event.target.value)}
              placeholder={apiKeyRequired ? 'Masukkan API key' : 'API key tersimpan di sesi ini'}
              autoComplete="new-password"
            />
            {renderIssue('apiKey')}
          </label>

          <label className="settings-field" htmlFor="provider-timeout">
            <span>Timeout (ms)</span>
            <input
              id="provider-timeout"
              type="number"
              value={Number.isNaN(draft.timeoutMs) ? '' : draft.timeoutMs}
              min={1000}
              max={300000}
              onChange={(event) => handleNumberChange('timeoutMs', event)}
            />
            {renderIssue('timeoutMs')}
          </label>

          <label className="settings-field" htmlFor="provider-max-output-tokens">
            <span>Max output tokens</span>
            <input
              id="provider-max-output-tokens"
              type="number"
              value={Number.isNaN(draft.maxOutputTokens) ? '' : draft.maxOutputTokens}
              min={1}
              max={100000}
              onChange={(event) => handleNumberChange('maxOutputTokens', event)}
            />
            {renderIssue('maxOutputTokens')}
          </label>

          <label className="settings-field" htmlFor="provider-temperature">
            <span>Temperature</span>
            <input
              id="provider-temperature"
              type="number"
              value={Number.isNaN(draft.temperature) ? '' : draft.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(event) => handleNumberChange('temperature', event)}
            />
            {renderIssue('temperature')}
          </label>
        </div>

        {issues.length > 0 && (
          <p className="field-error" role="alert">
            Periksa field provider yang ditandai sebelum menyimpan.
          </p>
        )}
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? 'Testing...' : 'Test connection'}
          </button>
          <button className="primary-button" type="submit" disabled={isTesting}>
            {editingProvider ? 'Simpan perubahan' : 'Tambah provider'}
          </button>
          {message && <span className="action-message">{message}</span>}
        </div>
        {testResult?.status === 'success' && (
          <p className="provider-test-success" role="status">
            Provider tersambung. Model {testResult.model} dapat digunakan ({testResult.latencyMs} ms).
          </p>
        )}
        {testResult?.status === 'failed' && (
          <p className="field-error" role="alert">
            {testResult.error.userMessage}
          </p>
        )}
      </form>

      <div className="provider-list" aria-live="polite">
        <div className="provider-list-heading">
          <div>
            <h3>Provider tersimpan</h3>
            <p>{providers.length === 0 ? 'Belum ada konfigurasi provider.' : `${providers.length} konfigurasi lokal.`}</p>
          </div>
        </div>

        {providers.length > 0 && (
          <div className="provider-cards">
            {providers.map((provider) => {
              const configured = hasApiKey(provider.apiKeyRef)

              return (
                <article className="provider-card" key={provider.id}>
                  <div className="provider-card-heading">
                    <div>
                      <h4>{provider.displayName}</h4>
                      <p>{provider.model}</p>
                    </div>
                    {provider.isDefault && <span className="module-badge">Default</span>}
                  </div>
                  <dl className="provider-details">
                    <div>
                      <dt>Base URL</dt>
                      <dd>{provider.baseUrl}</dd>
                    </div>
                    <div>
                      <dt>API key</dt>
                      <dd className={configured ? 'provider-secret-ready' : 'provider-secret-missing'}>
                        {configured ? 'Tersedia di sesi ini' : 'Masukkan ulang setelah reload'}
                      </dd>
                    </div>
                    <div>
                      <dt>Diperbarui</dt>
                      <dd>{formatDate(provider.updatedAt)}</dd>
                    </div>
                  </dl>
                  <div className="provider-card-actions">
                    <button className="secondary-button" type="button" onClick={() => handleEdit(provider)}>
                      Edit
                    </button>
                    {!provider.isDefault && (
                      <button className="secondary-button" type="button" onClick={() => onSetDefault(provider.id)}>
                        Jadikan default
                      </button>
                    )}
                    <button className="secondary-button danger-button" type="button" onClick={() => onDelete(provider.id)}>
                      Hapus
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
