import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/|~'

export interface PasswordGroup {
  readonly id: 'lowercase' | 'uppercase' | 'numbers' | 'symbols'
  readonly characters: string
}

const definition: GeneratorDefinition = {
  id: 'local.password-generator',
  kind: 'local',
  name: 'Password Generator',
  description: 'Membuat password acak dengan secure random secara lokal.',
  category: 'Security & Random',
  tags: ['password', 'security', 'random', 'secret', 'offline'],
  icon: '•••',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'length',
        type: 'integer',
        label: 'Panjang password',
        required: true,
        defaultValue: 16,
        min: 4,
        max: 256,
        helpText: 'Gunakan minimal 12 karakter untuk password penting.',
      },
      {
        id: 'count',
        type: 'integer',
        label: 'Jumlah password',
        required: true,
        defaultValue: 1,
        min: 1,
        max: 100,
      },
      {
        id: 'includeLowercase',
        type: 'boolean',
        label: 'Huruf kecil (a–z)',
        required: true,
        defaultValue: true,
      },
      {
        id: 'includeUppercase',
        type: 'boolean',
        label: 'Huruf besar (A–Z)',
        required: true,
        defaultValue: true,
      },
      {
        id: 'includeNumbers',
        type: 'boolean',
        label: 'Angka (0–9)',
        required: true,
        defaultValue: true,
      },
      {
        id: 'includeSymbols',
        type: 'boolean',
        label: 'Simbol',
        required: true,
        defaultValue: true,
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
  executorRef: 'built-in.local.password-generator',
  primaryActionLabel: 'Generate password',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

export function selectedPasswordGroups(input: GeneratorInput): readonly PasswordGroup[] {
  const groups: PasswordGroup[] = []

  if (input.includeLowercase === true) {
    groups.push({ id: 'lowercase', characters: LOWERCASE })
  }
  if (input.includeUppercase === true) {
    groups.push({ id: 'uppercase', characters: UPPERCASE })
  }
  if (input.includeNumbers === true) {
    groups.push({ id: 'numbers', characters: NUMBERS })
  }
  if (input.includeSymbols === true) {
    groups.push({ id: 'symbols', characters: SYMBOLS })
  }

  return groups
}

export function validatePasswordInput(input: GeneratorInput): ValidationResult {
  const length = input.length
  if (typeof length !== 'number' || !Number.isInteger(length)) {
    return {
      valid: false,
      issues: [createIssue('invalid-length', 'length', 'Panjang harus berupa bilangan bulat.')],
    }
  }

  if (length < 4 || length > 256) {
    return {
      valid: false,
      issues: [createIssue('length-out-of-range', 'length', 'Panjang harus berada di antara 4 dan 256.')],
    }
  }

  const count = input.count
  if (typeof count !== 'number' || !Number.isInteger(count)) {
    return {
      valid: false,
      issues: [createIssue('invalid-count', 'count', 'Jumlah harus berupa bilangan bulat.')],
    }
  }

  if (count < 1 || count > 100) {
    return {
      valid: false,
      issues: [createIssue('count-out-of-range', 'count', 'Jumlah harus berada di antara 1 dan 100.')],
    }
  }

  const booleanFields = [
    'includeLowercase',
    'includeUppercase',
    'includeNumbers',
    'includeSymbols',
  ] as const

  for (const fieldId of booleanFields) {
    if (typeof input[fieldId] !== 'boolean') {
      return {
        valid: false,
        issues: [createIssue('invalid-character-option', fieldId, 'Pilihan karakter harus berupa boolean.')],
      }
    }
  }

  const groups = selectedPasswordGroups(input)
  if (groups.length === 0) {
    return {
      valid: false,
      issues: [
        createIssue(
          'no-character-group',
          'includeLowercase',
          'Pilih minimal satu kelompok karakter.',
        ),
      ],
    }
  }

  if (length < groups.length) {
    return {
      valid: false,
      issues: [
        createIssue(
          'length-too-short-for-groups',
          'length',
          'Panjang password harus setidaknya sebanyak kelompok karakter yang dipilih.',
        ),
      ],
    }
  }

  return { valid: true, issues: [] }
}

export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('Batas random harus berupa bilangan bulat positif.')
  }

  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure random generator tidak tersedia pada browser ini.')
  }

  const maxUint32 = 0x1_0000_0000
  const rejectionLimit = maxUint32 - (maxUint32 % maxExclusive)
  const values = new Uint32Array(1)

  do {
    cryptoApi.getRandomValues(values)
  } while (values[0] >= rejectionLimit)

  return values[0] % maxExclusive
}

function createPassword(length: number, groups: readonly PasswordGroup[]): string {
  const pool = groups.map((group) => group.characters).join('')
  const characters = groups.map((group) => group.characters[secureRandomInt(group.characters.length)]!)

  while (characters.length < length) {
    characters.push(pool[secureRandomInt(pool.length)]!)
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomInt(index + 1)
    const current = characters[index]
    characters[index] = characters[swapIndex]
    characters[swapIndex] = current
  }

  return characters.join('')
}

export const passwordGenerator: GeneratorModule = {
  definition,

  validate: validatePasswordInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validatePasswordInput(input)
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

    const length = input.length as number
    const count = input.count as number
    const groups = selectedPasswordGroups(input)

    try {
      const content = Array.from(
        { length: count },
        () => createPassword(length, groups),
      ).join('\n')

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
