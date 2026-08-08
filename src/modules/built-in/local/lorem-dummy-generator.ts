import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const DATA_TYPES = [
  'lorem-words',
  'lorem-sentences',
  'lorem-paragraphs',
  'names',
  'emails',
  'numbers',
  'booleans',
  'records',
] as const
type DataType = (typeof DATA_TYPES)[number]

const LOCALES = ['id-ID', 'en-US'] as const
type DummyLocale = (typeof LOCALES)[number]

interface LocaleData {
  readonly loremWords: readonly string[]
  readonly firstNames: readonly string[]
  readonly lastNames: readonly string[]
  readonly emailDomain: string
  readonly statuses: readonly string[]
}

const LOCALE_DATA: Record<DummyLocale, LocaleData> = {
  'id-ID': {
    loremWords: [
      'kerja',
      'lokal',
      'cepat',
      'tenang',
      'berguna',
      'privat',
      'sederhana',
      'data',
      'output',
      'perangkat',
      'proses',
      'format',
      'dokumen',
      'ruang',
      'fokus',
      'aman',
      'rapi',
      'kecil',
      'rutin',
      'harian',
    ],
    firstNames: ['Ayu', 'Bima', 'Citra', 'Dimas', 'Intan', 'Raka', 'Sari', 'Tio'],
    lastNames: ['Pratama', 'Wijaya', 'Lestari', 'Santoso', 'Permata', 'Nugraha'],
    emailDomain: 'contoh.id',
    statuses: ['aktif', 'tertunda', 'selesai', 'ditinjau'],
  },
  'en-US': {
    loremWords: [
      'local',
      'fast',
      'calm',
      'useful',
      'private',
      'simple',
      'data',
      'output',
      'device',
      'process',
      'format',
      'document',
      'space',
      'focus',
      'safe',
      'clean',
      'small',
      'routine',
      'daily',
      'work',
    ],
    firstNames: ['Alex', 'Casey', 'Jordan', 'Morgan', 'Taylor', 'Riley', 'Sam', 'Avery'],
    lastNames: ['Smith', 'Taylor', 'Morgan', 'Parker', 'Jordan', 'Miller'],
    emailDomain: 'example.com',
    statuses: ['active', 'pending', 'done', 'review'],
  },
}

export interface DummyGeneration {
  readonly outputType: 'plain-text' | 'json'
  readonly content: string
}

const definition: GeneratorDefinition = {
  id: 'local.lorem-dummy',
  kind: 'local',
  name: 'Lorem/Dummy Data',
  description: 'Membuat teks lorem dan data dummy terstruktur secara lokal.',
  category: 'Text & Format',
  tags: ['lorem', 'dummy', 'mock', 'data', 'sample', 'locale', 'offline'],
  icon: 'Aa',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'type',
        type: 'enum',
        label: 'Tipe data',
        required: true,
        defaultValue: 'lorem-sentences',
        options: [
          { value: 'lorem-words', label: 'Lorem words' },
          { value: 'lorem-sentences', label: 'Lorem sentences' },
          { value: 'lorem-paragraphs', label: 'Lorem paragraphs' },
          { value: 'names', label: 'Names' },
          { value: 'emails', label: 'Emails' },
          { value: 'numbers', label: 'Numbers' },
          { value: 'booleans', label: 'Booleans' },
          { value: 'records', label: 'Records JSON' },
        ],
        helpText: 'Lorem menghasilkan teks; tipe dummy lainnya menghasilkan JSON array.',
      },
      {
        id: 'count',
        type: 'integer',
        label: 'Jumlah',
        required: true,
        defaultValue: 5,
        min: 1,
        max: 1000,
        helpText: 'Jumlah item yang dibuat.',
        hintByFieldValue: {
          fieldId: 'type',
          values: {
            'lorem-words': { helpText: 'Jumlah kata yang dibuat, maksimal 1000.' },
            'lorem-sentences': { helpText: 'Jumlah kalimat yang dibuat, maksimal 200.' },
            'lorem-paragraphs': { helpText: 'Jumlah paragraf yang dibuat, maksimal 50.' },
            names: { helpText: 'Jumlah nama pada JSON array, maksimal 1000.' },
            emails: { helpText: 'Jumlah email dummy pada JSON array, maksimal 1000.' },
            numbers: { helpText: 'Jumlah angka pada JSON array, maksimal 1000.' },
            booleans: { helpText: 'Jumlah boolean pada JSON array, maksimal 1000.' },
            records: { helpText: 'Jumlah record object pada JSON array, maksimal 1000.' },
          },
        },
      },
      {
        id: 'locale',
        type: 'enum',
        label: 'Locale',
        required: true,
        defaultValue: 'id-ID',
        options: [
          { value: 'id-ID', label: 'Indonesia (id-ID)' },
          { value: 'en-US', label: 'English (en-US)' },
        ],
        helpText: 'Locale memengaruhi kosakata, nama, domain email, dan status.',
      },
    ],
  },
  outputTypes: ['plain-text', 'json'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.lorem-dummy',
  primaryActionLabel: 'Generate data',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function randomIndex(length: number): number {
  if (length <= 0) {
    throw new Error('Daftar data tidak boleh kosong.')
  }

  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(1)
    const range = 0x100000000
    const limit = Math.floor(range / length) * length

    do {
      cryptoApi.getRandomValues(values)
    } while (values[0]! >= limit)

    return values[0]! % length
  }

  return Math.floor(Math.random() * length)
}

function randomInteger(maxExclusive: number): number {
  return randomIndex(maxExclusive)
}

function pick<T>(values: readonly T[]): T {
  return values[randomIndex(values.length)]!
}

function localeData(locale: DummyLocale): LocaleData {
  return LOCALE_DATA[locale]
}

function createLoremWord(data: LocaleData): string {
  return pick(data.loremWords)
}

function createSentence(data: LocaleData): string {
  const wordCount = 8 + randomInteger(5)
  const words = Array.from({ length: wordCount }, () => createLoremWord(data))
  const sentence = words.join(' ')
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`
}

function createName(data: LocaleData): string {
  return `${pick(data.firstNames)} ${pick(data.lastNames)}`
}

function createEmail(name: string, data: LocaleData): string {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/gu, '.')
  return `${normalizedName}${randomInteger(1000)}@${data.emailDomain}`
}

function structuredJson(value: unknown): DummyGeneration {
  return {
    outputType: 'json',
    content: JSON.stringify(value, null, 2),
  }
}

function maxCountForType(type: DataType): number {
  switch (type) {
    case 'lorem-sentences':
      return 200
    case 'lorem-paragraphs':
      return 50
    default:
      return 1000
  }
}

export function generateDummyData(
  type: DataType,
  count: number,
  locale: DummyLocale,
): DummyGeneration {
  const data = localeData(locale)

  switch (type) {
    case 'lorem-words':
      return {
        outputType: 'plain-text',
        content: Array.from({ length: count }, () => createLoremWord(data)).join(' '),
      }
    case 'lorem-sentences':
      return {
        outputType: 'plain-text',
        content: Array.from({ length: count }, () => createSentence(data)).join(' '),
      }
    case 'lorem-paragraphs':
      return {
        outputType: 'plain-text',
        content: Array.from({ length: count }, () =>
          Array.from({ length: 3 }, () => createSentence(data)).join(' '),
        ).join('\n\n'),
      }
    case 'names':
      return structuredJson(Array.from({ length: count }, () => createName(data)))
    case 'emails':
      return structuredJson(
        Array.from({ length: count }, () => createEmail(createName(data), data)),
      )
    case 'numbers':
      return structuredJson(Array.from({ length: count }, () => 1 + randomInteger(100000)))
    case 'booleans':
      return structuredJson(Array.from({ length: count }, () => randomInteger(2) === 1))
    case 'records':
      return structuredJson(
        Array.from({ length: count }, (_, index) => {
          const name = createName(data)
          return {
            id: index + 1,
            name,
            email: createEmail(name, data),
            status: pick(data.statuses),
          }
        }),
      )
  }
}

function validateDummyDataInput(input: GeneratorInput): ValidationResult {
  const type = input.type
  if (typeof type !== 'string' || !DATA_TYPES.includes(type as DataType)) {
    return {
      valid: false,
      issues: [createIssue('invalid-type', 'type', 'Pilih tipe data yang tersedia.')],
    }
  }

  const count = input.count
  if (typeof count !== 'number' || !Number.isInteger(count)) {
    return {
      valid: false,
      issues: [createIssue('invalid-count', 'count', 'Jumlah harus berupa bilangan bulat.')],
    }
  }

  const maxCount = maxCountForType(type as DataType)
  if (count < 1 || count > maxCount) {
    return {
      valid: false,
      issues: [
        createIssue(
          'count-out-of-range',
          'count',
          `Jumlah harus berada di antara 1 dan ${maxCount} untuk tipe data ini.`,
        ),
      ],
    }
  }

  const locale = input.locale
  if (typeof locale !== 'string' || !LOCALES.includes(locale as DummyLocale)) {
    return {
      valid: false,
      issues: [createIssue('invalid-locale', 'locale', 'Pilih locale yang tersedia.')],
    }
  }

  return { valid: true, issues: [] }
}

export const loremDummyGenerator: GeneratorModule = {
  definition,

  validate: validateDummyDataInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateDummyDataInput(input)
    if (!validation.valid) {
      const firstIssue = validation.issues[0]!
      return {
        status: 'failed',
        error: {
          code: firstIssue.code,
          fieldId: firstIssue.fieldId,
          retryable: false,
          userMessage: firstIssue.message,
        },
      }
    }

    try {
      const generated = generateDummyData(
        input.type as DataType,
        input.count as number,
        input.locale as DummyLocale,
      )

      return {
        status: 'success',
        output: {
          type: generated.outputType,
          mimeType:
            generated.outputType === 'json'
              ? 'application/json;charset=utf-8'
              : 'text/plain;charset=utf-8',
          content: generated.content,
        },
      }
    } catch {
      return {
        status: 'failed',
        error: {
          code: 'dummy-generation-failed',
          retryable: false,
          userMessage: 'Data dummy tidak dapat dibuat. Coba lagi.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
