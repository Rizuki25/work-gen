import type {
  GeneratorDefinition,
  GeneratorKind,
  GeneratorModule,
} from '../contracts/generator'

const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/
const FIELD_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export type RegistryErrorCode =
  | 'duplicate-id'
  | 'invalid-module'
  | 'invalid-definition'

export class GeneratorRegistryError extends Error {
  readonly code: RegistryErrorCode

  constructor(code: RegistryErrorCode, message: string) {
    super(message)
    this.name = 'GeneratorRegistryError'
    this.code = code
  }
}

export interface RegistryFilter {
  readonly kind?: GeneratorKind
  readonly category?: string
  readonly enabledOnly?: boolean
  readonly featuredOnly?: boolean
}

export class GeneratorRegistry {
  private readonly modules = new Map<string, GeneratorModule>()

  constructor(initialModules: readonly GeneratorModule[] = []) {
    this.registerAll(initialModules)
  }

  register(module: GeneratorModule): void {
    this.validateModule(module)

    const id = module.definition.id
    if (this.modules.has(id)) {
      throw new GeneratorRegistryError(
        'duplicate-id',
        `Generator dengan id "${id}" sudah terdaftar.`,
      )
    }

    this.modules.set(id, module)
  }

  registerAll(modules: readonly GeneratorModule[]): void {
    for (const module of modules) {
      this.register(module)
    }
  }

  get(id: string): GeneratorModule | undefined {
    return this.modules.get(id)
  }

  has(id: string): boolean {
    return this.modules.has(id)
  }

  list(filter: RegistryFilter = {}): readonly GeneratorModule[] {
    const enabledOnly = filter.enabledOnly ?? true
    const normalizedCategory = filter.category?.trim().toLocaleLowerCase()

    return [...this.modules.values()]
      .filter(({ definition }) => !enabledOnly || definition.enabled)
      .filter(({ definition }) => !filter.kind || definition.kind === filter.kind)
      .filter(
        ({ definition }) =>
          !normalizedCategory || definition.category.toLocaleLowerCase() === normalizedCategory,
      )
      .filter(({ definition }) => !filter.featuredOnly || definition.featured === true)
      .sort((left, right) => left.definition.name.localeCompare(right.definition.name))
  }

  search(query: string, filter: RegistryFilter = {}): readonly GeneratorModule[] {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    if (!normalizedQuery) {
      return this.list(filter)
    }

    return this.list(filter).filter(({ definition }) => {
      const searchableText = [
        definition.name,
        definition.description,
        definition.category,
        ...definition.tags,
      ]
        .join(' ')
        .toLocaleLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }

  private validateModule(module: GeneratorModule): void {
    if (!module || typeof module !== 'object') {
      throw new GeneratorRegistryError(
        'invalid-module',
        'Generator module harus berupa object yang valid.',
      )
    }

    if (
      typeof module.validate !== 'function' ||
      typeof module.execute !== 'function' ||
      typeof module.supportedOutputs !== 'function'
    ) {
      throw new GeneratorRegistryError(
        'invalid-module',
        'Generator module harus memiliki validate, execute, dan supportedOutputs.',
      )
    }

    this.validateDefinition(module.definition)

    const declaredOutputs = new Set(module.definition.outputTypes)
    const supportedOutputs = new Set(module.supportedOutputs())
    const hasUnsupportedDeclaration = [...declaredOutputs].some(
      (output) => !supportedOutputs.has(output),
    )

    if (hasUnsupportedDeclaration) {
      throw new GeneratorRegistryError(
        'invalid-module',
        `Output generator "${module.definition.id}" tidak konsisten dengan supportedOutputs().`,
      )
    }
  }

  private validateDefinition(definition: GeneratorDefinition): void {
    if (!definition || typeof definition !== 'object') {
      throw new GeneratorRegistryError(
        'invalid-definition',
        'Generator definition harus berupa object yang valid.',
      )
    }

    if (!ID_PATTERN.test(definition.id)) {
      throw new GeneratorRegistryError(
        'invalid-definition',
        `Generator id "${definition.id}" tidak valid. Gunakan lowercase dengan namespace.` ,
      )
    }

    const requiredTextFields: Array<keyof GeneratorDefinition> = [
      'name',
      'description',
      'category',
      'version',
      'executorRef',
    ]

    for (const field of requiredTextFields) {
      const value = definition[field]
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new GeneratorRegistryError(
          'invalid-definition',
          `Field definition "${String(field)}" wajib diisi untuk "${definition.id}".`,
        )
      }
    }

    if (!definition.inputSchema || !Array.isArray(definition.inputSchema.fields)) {
      throw new GeneratorRegistryError(
        'invalid-definition',
        `Input schema generator "${definition.id}" tidak valid.`,
      )
    }

    const fieldIds = new Set<string>()
    for (const field of definition.inputSchema.fields) {
      if (!FIELD_ID_PATTERN.test(field.id)) {
        throw new GeneratorRegistryError(
          'invalid-definition',
          `Field id "${field.id}" pada generator "${definition.id}" tidak valid.`,
        )
      }

      if (fieldIds.has(field.id)) {
        throw new GeneratorRegistryError(
          'invalid-definition',
          `Field id "${field.id}" duplikat pada generator "${definition.id}".`,
        )
      }

      fieldIds.add(field.id)
    }

    if (definition.outputTypes.length === 0) {
      throw new GeneratorRegistryError(
        'invalid-definition',
        `Generator "${definition.id}" harus mendeklarasikan minimal satu output type.`,
      )
    }

    if (definition.kind !== 'ai' && definition.capabilities.network) {
      throw new GeneratorRegistryError(
        'invalid-definition',
        `Generator ${definition.kind} "${definition.id}" tidak boleh membutuhkan network.`,
      )
    }
  }
}
