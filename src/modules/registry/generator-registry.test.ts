import { describe, expect, it } from 'vitest'
import type {
  GeneratorDefinition,
  GeneratorModule,
} from '../contracts'
import { createDefaultRegistry } from '../built-in'
import {
  GeneratorRegistry,
  GeneratorRegistryError,
} from './generator-registry'

const baseDefinition: GeneratorDefinition = {
  id: 'local.test-tool',
  kind: 'local',
  name: 'Test Tool',
  description: 'Generator untuk pengujian registry.',
  category: 'Testing',
  tags: ['test', 'offline'],
  version: '0.1.0',
  inputSchema: { fields: [] },
  outputTypes: ['plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: false,
    network: false,
  },
  executorRef: 'test.local.test-tool',
  enabled: true,
  featured: false,
}

function makeModule(
  overrides: Partial<GeneratorDefinition> = {},
): GeneratorModule {
  const definition: GeneratorDefinition = {
    ...baseDefinition,
    ...overrides,
  }

  return {
    definition,
    validate: () => ({ valid: true, issues: [] }),
    execute: async () => ({
      status: 'success',
      output: {
        type: definition.outputTypes[0]!,
        mimeType: 'text/plain;charset=utf-8',
        content: 'test',
      },
    }),
    supportedOutputs: () => definition.outputTypes,
  }
}

describe('GeneratorRegistry', () => {
  it('mendaftarkan module dan mengambilnya berdasarkan id', () => {
    const registry = new GeneratorRegistry()
    const module = makeModule()

    registry.register(module)

    expect(registry.has('local.test-tool')).toBe(true)
    expect(registry.get('local.test-tool')).toBe(module)
  })

  it('mencari berdasarkan nama, deskripsi, kategori, dan tag tanpa membedakan case', () => {
    const registry = new GeneratorRegistry([
      makeModule({
        id: 'local.json-tool',
        name: 'JSON Formatter',
        description: 'Memformat data terstruktur.',
        tags: ['json', 'format'],
      }),
      makeModule({
        id: 'local.password-tool',
        name: 'Password Generator',
        description: 'Membuat password lokal.',
        tags: ['security'],
      }),
    ])

    expect(registry.search('FORMAT').map((module) => module.definition.id)).toEqual([
      'local.json-tool',
    ])
    expect(registry.search('SECURITY').map((module) => module.definition.id)).toEqual([
      'local.password-tool',
    ])
  })

  it('memfilter kind, category, featured, dan module disabled', () => {
    const registry = new GeneratorRegistry([
      makeModule({
        id: 'local.featured-tool',
        name: 'Featured Local',
        featured: true,
      }),
      makeModule({
        id: 'template.report-tool',
        kind: 'template',
        name: 'Template Report',
        category: 'Reports',
        capabilities: { ...baseDefinition.capabilities, network: false },
      }),
      makeModule({
        id: 'local.disabled-tool',
        name: 'Disabled Local',
        enabled: false,
      }),
    ])

    expect(registry.list({ kind: 'template' }).map((module) => module.definition.id)).toEqual([
      'template.report-tool',
    ])
    expect(registry.list({ category: 'Reports' })).toHaveLength(1)
    expect(registry.list({ featuredOnly: true })).toHaveLength(1)
    expect(registry.list().map((module) => module.definition.id)).not.toContain(
      'local.disabled-tool',
    )
    expect(registry.list({ enabledOnly: false })).toHaveLength(3)
  })

  it('memuat JSON Formatter pada default built-in registry', () => {
    const registry = createDefaultRegistry()

    expect(registry.get('local.json-formatter')?.definition.kind).toBe('local')
    expect(registry.search('json').map((module) => module.definition.id)).toEqual([
      'local.csv-json',
      'local.json-yaml',
      'local.json-formatter',
    ])
  })

  it('menolak duplicate id', () => {
    const registry = new GeneratorRegistry([makeModule()])

    expect(() => registry.register(makeModule())).toThrowError(GeneratorRegistryError)
    expect(() => registry.register(makeModule())).toThrowError('sudah terdaftar')
  })

  it('menolak id definition yang tidak mengikuti format namespace lowercase', () => {
    const registry = new GeneratorRegistry()

    expect(() => registry.register(makeModule({ id: 'Local.Invalid' }))).toThrowError(
      'tidak valid',
    )
  })

  it('menolak Local atau Template yang membutuhkan network', () => {
    const registry = new GeneratorRegistry()

    expect(() =>
      registry.register(
        makeModule({
          id: 'local.network-tool',
          capabilities: { ...baseDefinition.capabilities, network: true },
        }),
      ),
    ).toThrowError('tidak boleh membutuhkan network')
  })

  it('menolak declaration output yang tidak didukung module', () => {
    const registry = new GeneratorRegistry()
    const module = makeModule({ id: 'local.mismatch-tool', outputTypes: ['json'] })

    const mismatchedModule: GeneratorModule = {
      ...module,
      supportedOutputs: () => ['plain-text'],
    }

    expect(() => registry.register(mismatchedModule)).toThrowError(
      'tidak konsisten dengan supportedOutputs',
    )
  })
})
