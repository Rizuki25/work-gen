import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const UUID_FORMATS = ['lowercase', 'uppercase', 'braced'] as const
type UuidFormat = (typeof UUID_FORMATS)[number]

const definition: GeneratorDefinition = {
  id: 'local.uuid-generator',
  kind: 'local',
  name: 'UUID Generator',
  description: 'Membuat UUID v4 secara lokal menggunakan sumber random yang aman.',
  category: 'Security & Random',
  tags: ['uuid', 'guid', 'random', 'offline'],
  icon: 'ID',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'count',
        type: 'integer',
        label: 'Jumlah',
        required: true,
        defaultValue: 1,
        min: 1,
        max: 1000,
        helpText: 'Jumlah UUID yang dibuat, maksimal 1000.',
      },
      {
        id: 'format',
        type: 'enum',
        label: 'Format',
        required: true,
        defaultValue: 'lowercase',
        options: [
          { value: 'lowercase', label: 'Lowercase' },
          { value: 'uppercase', label: 'Uppercase' },
          { value: 'braced', label: 'Dengan kurung kurawal' },
        ],
      },
    ],
  },
  outputTypes: ['plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.uuid-generator',
  primaryActionLabel: 'Generate UUID',
  enabled: true,
  featured: true,
}

function issue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function validateUuidInput(input: GeneratorInput): ValidationResult {
  const count = input.count
  if (typeof count !== 'number' || !Number.isInteger(count)) {
    return {
      valid: false,
      issues: [issue('invalid-count', 'count', 'Jumlah harus berupa bilangan bulat.')],
    }
  }

  if (count < 1 || count > 1000) {
    return {
      valid: false,
      issues: [issue('count-out-of-range', 'count', 'Jumlah harus berada di antara 1 dan 1000.')],
    }
  }

  const format = input.format
  if (
    typeof format !== 'string' ||
    !UUID_FORMATS.includes(format as UuidFormat)
  ) {
    return {
      valid: false,
      issues: [issue('invalid-format', 'format', 'Pilih format UUID yang tersedia.')],
    }
  }

  return { valid: true, issues: [] }
}

export function createUuidV4(): string {
  const cryptoApi = globalThis.crypto

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure random generator tidak tersedia pada browser ini.')
  }

  const bytes = new Uint8Array(16)
  cryptoApi.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function formatUuid(uuid: string, format: UuidFormat): string {
  switch (format) {
    case 'uppercase':
      return uuid.toUpperCase()
    case 'braced':
      return `{${uuid}}`
    default:
      return uuid
  }
}

export const uuidGenerator: GeneratorModule = {
  definition,

  validate: validateUuidInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateUuidInput(input)
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

    const count = input.count as number
    const format = input.format as UuidFormat

    try {
      const content = Array.from({ length: count }, () => formatUuid(createUuidV4(), format)).join(
        '\n',
      )

      return {
        status: 'success',
        output: {
          type: 'plain-text',
          mimeType: 'text/plain;charset=utf-8',
          content,
        },
      }
    } catch {
      return {
        status: 'failed',
        error: {
          code: 'secure-random-unavailable',
          retryable: false,
          userMessage: 'Secure random generator tidak tersedia pada browser ini.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
