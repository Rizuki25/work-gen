import { describe, expect, it } from 'vitest'
import {
  createDefaultAppSettings,
  loadAppSettings,
  normalizeAppSettings,
  saveAppSettings,
  SETTINGS_STORAGE_KEY,
  type SettingsStorage,
} from './app-settings'

function createMemoryStorage(initialValue?: string): SettingsStorage & { value: string | null } {
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

describe('app settings', () => {
  it('menyediakan default settings yang local-first', () => {
    expect(createDefaultAppSettings()).toEqual({
      theme: 'dark',
      defaultOutputFormat: 'plain-text',
      historyEnabled: true,
      saveAiContentToHistory: false,
      showAiDataBoundaryNotice: true,
      defaultProviderId: null,
      favorites: [],
    })
  })

  it('memuat settings tersimpan dan mengabaikan nilai invalid', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        theme: 'light',
        defaultOutputFormat: 'json',
        historyEnabled: false,
        defaultProviderId: '',
        favorites: ['local.uuid-generator', 42],
        unknown: true,
      }),
    )

    expect(loadAppSettings(storage)).toEqual({
      theme: 'light',
      defaultOutputFormat: 'json',
      historyEnabled: false,
      saveAiContentToHistory: false,
      showAiDataBoundaryNotice: true,
      defaultProviderId: null,
      favorites: ['local.uuid-generator'],
    })
  })

  it('menyimpan settings dalam key versi yang ditentukan', () => {
    const storage = createMemoryStorage()
    const settings = { ...createDefaultAppSettings(), theme: 'light' as const }

    saveAppSettings(settings, storage)

    expect(storage.value).toContain('"theme":"light"')
    expect(SETTINGS_STORAGE_KEY).toBe('workgen.settings.v1')
    expect(loadAppSettings(storage).theme).toBe('light')
  })

  it('mengembalikan default saat payload bukan object', () => {
    expect(normalizeAppSettings(null)).toEqual(createDefaultAppSettings())
    expect(normalizeAppSettings('invalid').theme).toBe('dark')
  })
})
