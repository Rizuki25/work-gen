export type AppTheme = 'dark' | 'light' | 'system'
export type DefaultOutputFormat = 'plain-text' | 'markdown' | 'json' | 'csv'

export interface AppSettings {
  readonly theme: AppTheme
  readonly defaultOutputFormat: DefaultOutputFormat
  readonly historyEnabled: boolean
  readonly saveAiContentToHistory: boolean
  readonly showAiDataBoundaryNotice: boolean
  readonly defaultProviderId: string | null
  readonly favorites: readonly string[]
}

export interface SettingsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const SETTINGS_STORAGE_KEY = 'workgen.settings.v1'

export function createDefaultAppSettings(): AppSettings {
  return {
    theme: 'dark',
    defaultOutputFormat: 'plain-text',
    historyEnabled: true,
    saveAiContentToHistory: false,
    showAiDataBoundaryNotice: true,
    defaultProviderId: null,
    favorites: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAppTheme(value: unknown): value is AppTheme {
  return value === 'dark' || value === 'light' || value === 'system'
}

function isDefaultOutputFormat(value: unknown): value is DefaultOutputFormat {
  return value === 'plain-text' || value === 'markdown' || value === 'json' || value === 'csv'
}

function browserStorage(): SettingsStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export function normalizeAppSettings(value: unknown): AppSettings {
  const defaults = createDefaultAppSettings()
  if (!isRecord(value)) {
    return defaults
  }

  const favorites = Array.isArray(value.favorites)
    ? value.favorites.filter((favorite): favorite is string => typeof favorite === 'string')
    : defaults.favorites

  return {
    theme: isAppTheme(value.theme) ? value.theme : defaults.theme,
    defaultOutputFormat: isDefaultOutputFormat(value.defaultOutputFormat)
      ? value.defaultOutputFormat
      : defaults.defaultOutputFormat,
    historyEnabled:
      typeof value.historyEnabled === 'boolean' ? value.historyEnabled : defaults.historyEnabled,
    saveAiContentToHistory:
      typeof value.saveAiContentToHistory === 'boolean'
        ? value.saveAiContentToHistory
        : defaults.saveAiContentToHistory,
    showAiDataBoundaryNotice:
      typeof value.showAiDataBoundaryNotice === 'boolean'
        ? value.showAiDataBoundaryNotice
        : defaults.showAiDataBoundaryNotice,
    defaultProviderId:
      typeof value.defaultProviderId === 'string' && value.defaultProviderId.length > 0
        ? value.defaultProviderId
        : defaults.defaultProviderId,
    favorites,
  }
}

export function loadAppSettings(storage: SettingsStorage | undefined = browserStorage()): AppSettings {
  if (!storage) {
    return createDefaultAppSettings()
  }

  try {
    const rawValue = storage.getItem(SETTINGS_STORAGE_KEY)
    return rawValue ? normalizeAppSettings(JSON.parse(rawValue)) : createDefaultAppSettings()
  } catch {
    return createDefaultAppSettings()
  }
}

export function saveAppSettings(
  settings: AppSettings,
  storage: SettingsStorage | undefined = browserStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizeAppSettings(settings)))
  } catch {
    // Settings are a convenience; the app remains usable if storage is unavailable or full.
  }
}
