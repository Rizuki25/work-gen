import { describe, expect, it } from 'vitest'
import {
  createMemorySecretStore,
  createProviderConfig,
  loadProviderConfigs,
  normalizeBaseUrl,
  normalizeProviderList,
  PROVIDER_STORAGE_KEY,
  saveProviderConfigs,
  validateProviderDraft,
  type ProviderDraft,
  type ProviderStorage,
} from './provider-store'

function createMemoryStorage(initialValue?: string): ProviderStorage & { value: string | null } {
  return {
    value: initialValue ?? null,
    getItem() {
      return this.value
    },
    setItem(_key, value) {
      this.value = value
    },
  }
}

const validDraft: ProviderDraft = {
  displayName: 'OpenAI pribadi',
  type: 'openai-compatible',
  baseUrl: 'https://api.example.com/v1/',
  model: 'example-model',
  apiKey: 'secret-value',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
}

describe('provider store', () => {
  it('memvalidasi provider dan menormalisasi trailing slash Base URL', () => {
    expect(validateProviderDraft(validDraft)).toEqual({ valid: true, issues: [] })
    expect(normalizeBaseUrl(validDraft.baseUrl)).toBe('https://api.example.com/v1')
  })

  it('menolak field wajib dan rentang konfigurasi yang invalid', () => {
    const result = validateProviderDraft({
      ...validDraft,
      displayName: '',
      baseUrl: 'not-a-url',
      model: '',
      apiKey: '',
      timeoutMs: 500,
      temperature: 3,
    })

    expect(result.valid).toBe(false)
    expect(result.issues.map((issue) => issue.fieldId)).toEqual([
      'displayName',
      'baseUrl',
      'model',
      'apiKey',
      'timeoutMs',
      'temperature',
    ])
  })

  it('menyimpan metadata tanpa API key ke storage lokal', () => {
    const storage = createMemoryStorage()
    const provider = createProviderConfig(
      validDraft,
      undefined,
      new Date('2026-08-08T00:00:00.000Z'),
      true,
    )

    saveProviderConfigs([provider], storage)

    expect(PROVIDER_STORAGE_KEY).toBe('workgen.providers.v1')
    expect(storage.value).not.toContain('secret-value')
    expect(loadProviderConfigs(storage)).toEqual([provider])
  })

  it('menjaga hanya satu provider default saat memuat data', () => {
    const providers = normalizeProviderList([
      { ...createProviderConfig(validDraft, undefined, new Date('2026-08-08T00:00:00.000Z'), false), isDefault: true },
      {
        ...createProviderConfig(
          { ...validDraft, displayName: 'Gateway kedua' },
          undefined,
          new Date('2026-08-08T00:00:00.000Z'),
          false,
        ),
        isDefault: true,
      },
    ])

    expect(providers.filter((provider) => provider.isDefault)).toHaveLength(1)
    expect(providers[0]?.isDefault).toBe(true)
  })

  it('menyimpan secret di memory store dan dapat membersihkannya', () => {
    const secrets = createMemorySecretStore()

    secrets.set('secure:provider-1:api-key', '  secret-value  ')

    expect(secrets.has('secure:provider-1:api-key')).toBe(true)
    expect(secrets.get('secure:provider-1:api-key')).toBe('secret-value')

    secrets.clear()

    expect(secrets.has('secure:provider-1:api-key')).toBe(false)
  })
})
