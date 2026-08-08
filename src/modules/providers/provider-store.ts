export type ProviderType = 'openai-compatible'

export interface ProviderConfig {
  readonly id: string
  readonly displayName: string
  readonly type: ProviderType
  readonly baseUrl: string
  readonly model: string
  readonly apiKeyRef: string
  readonly timeoutMs: number
  readonly maxOutputTokens: number
  readonly temperature: number
  readonly isDefault: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ProviderDraft {
  readonly id?: string
  readonly displayName: string
  readonly type: ProviderType
  readonly baseUrl: string
  readonly model: string
  readonly apiKey: string
  readonly timeoutMs: number
  readonly maxOutputTokens: number
  readonly temperature: number
}

export interface ProviderValidationIssue {
  readonly fieldId: string
  readonly message: string
}

export interface ProviderValidationResult {
  readonly valid: boolean
  readonly issues: readonly ProviderValidationIssue[]
}

export interface ProviderStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SecretStore {
  get(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
  has(key: string): boolean
  clear(): void
}

export const PROVIDER_STORAGE_KEY = 'workgen.providers.v1'

function browserStorage(): ProviderStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProviderType(value: unknown): value is ProviderType {
  return value === 'openai-compatible'
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (!isFiniteNumber(value) || value < min || value > max) {
    return fallback
  }

  return value
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeProvider(value: unknown): ProviderConfig | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = normalizeString(value.id, '')
  const apiKeyRef = normalizeString(value.apiKeyRef, '')
  if (id.length === 0 || apiKeyRef.length === 0) {
    return undefined
  }

  return {
    id,
    displayName: normalizeString(value.displayName, 'Unnamed provider'),
    type: isProviderType(value.type) ? value.type : 'openai-compatible',
    baseUrl: normalizeString(value.baseUrl, ''),
    model: normalizeString(value.model, ''),
    apiKeyRef,
    timeoutMs: normalizeNumber(value.timeoutMs, 60000, 1000, 300000),
    maxOutputTokens: normalizeNumber(value.maxOutputTokens, 2048, 1, 100000),
    temperature: normalizeNumber(value.temperature, 0.3, 0, 2),
    isDefault: normalizeBoolean(value.isDefault, false),
    createdAt: normalizeString(value.createdAt, new Date(0).toISOString()),
    updatedAt: normalizeString(value.updatedAt, new Date(0).toISOString()),
  }
}

export function normalizeProviderList(value: unknown): ProviderConfig[] {
  if (!Array.isArray(value)) {
    return []
  }

  const providers = value
    .map(normalizeProvider)
    .filter((provider): provider is ProviderConfig => provider !== undefined)

  const defaultIndex = providers.findIndex((provider) => provider.isDefault)
  return providers.map((provider, index) => ({
    ...provider,
    isDefault: defaultIndex >= 0 ? index === defaultIndex : index === 0,
  }))
}

export function loadProviderConfigs(
  storage: ProviderStorage | undefined = browserStorage(),
): ProviderConfig[] {
  if (!storage) {
    return []
  }

  try {
    const rawValue = storage.getItem(PROVIDER_STORAGE_KEY)
    return rawValue ? normalizeProviderList(JSON.parse(rawValue)) : []
  } catch {
    return []
  }
}

export function saveProviderConfigs(
  providers: readonly ProviderConfig[],
  storage: ProviderStorage | undefined = browserStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(normalizeProviderList(providers)))
  } catch {
    // Provider metadata is optional; the app remains usable if storage is unavailable.
  }
}

export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/u, '')
}

function isValidBaseUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.length > 0
  } catch {
    return false
  }
}

export function validateProviderDraft(
  draft: ProviderDraft,
  options: { readonly requireApiKey?: boolean } = {},
): ProviderValidationResult {
  const issues: ProviderValidationIssue[] = []
  const requireApiKey = options.requireApiKey ?? true

  if (draft.displayName.trim().length === 0) {
    issues.push({ fieldId: 'displayName', message: 'Nama provider wajib diisi.' })
  }

  const baseUrl = normalizeBaseUrl(draft.baseUrl)
  if (baseUrl.length === 0) {
    issues.push({ fieldId: 'baseUrl', message: 'Base URL wajib diisi.' })
  } else if (!isValidBaseUrl(baseUrl)) {
    issues.push({ fieldId: 'baseUrl', message: 'Base URL harus berupa URL HTTP atau HTTPS yang valid.' })
  }

  if (draft.model.trim().length === 0) {
    issues.push({ fieldId: 'model', message: 'Model wajib diisi.' })
  }

  if (requireApiKey && draft.apiKey.trim().length === 0) {
    issues.push({ fieldId: 'apiKey', message: 'API key diperlukan untuk menyimpan provider.' })
  }

  if (!isFiniteNumber(draft.timeoutMs) || draft.timeoutMs < 1000 || draft.timeoutMs > 300000) {
    issues.push({ fieldId: 'timeoutMs', message: 'Timeout harus antara 1.000 dan 300.000 ms.' })
  }

  if (
    !isFiniteNumber(draft.maxOutputTokens) ||
    draft.maxOutputTokens < 1 ||
    draft.maxOutputTokens > 100000
  ) {
    issues.push({ fieldId: 'maxOutputTokens', message: 'Batas output token harus antara 1 dan 100.000.' })
  }

  if (!isFiniteNumber(draft.temperature) || draft.temperature < 0 || draft.temperature > 2) {
    issues.push({ fieldId: 'temperature', message: 'Temperature harus antara 0 dan 2.' })
  }

  return { valid: issues.length === 0, issues }
}

export function createProviderId(randomUuid: () => string = defaultRandomUuid): string {
  return `provider-${randomUuid()}`
}

function defaultRandomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createProviderConfig(
  draft: ProviderDraft,
  existing: ProviderConfig | undefined,
  now: Date,
  isDefault: boolean,
): ProviderConfig {
  const id = existing?.id ?? draft.id ?? createProviderId()
  const timestamp = now.toISOString()

  return {
    id,
    displayName: draft.displayName.trim(),
    type: draft.type,
    baseUrl: normalizeBaseUrl(draft.baseUrl),
    model: draft.model.trim(),
    apiKeyRef: existing?.apiKeyRef ?? `secure:${id}:api-key`,
    timeoutMs: draft.timeoutMs,
    maxOutputTokens: draft.maxOutputTokens,
    temperature: draft.temperature,
    isDefault,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export function createMemorySecretStore(): SecretStore {
  const secrets = new Map<string, string>()

  return {
    get(key) {
      return secrets.get(key)
    },
    set(key, value) {
      if (value.trim().length === 0) {
        secrets.delete(key)
        return
      }

      secrets.set(key, value.trim())
    },
    delete(key) {
      secrets.delete(key)
    },
    has(key) {
      return secrets.has(key)
    },
    clear() {
      secrets.clear()
    },
  }
}
