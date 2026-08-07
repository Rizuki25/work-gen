import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const HASH_ALGORITHMS = ['SHA-256', 'SHA-384', 'SHA-512'] as const
type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

const HASH_ENCODINGS = ['hex', 'base64'] as const
type HashEncoding = (typeof HASH_ENCODINGS)[number]

const definition: GeneratorDefinition = {
  id: 'local.hash-generator',
  kind: 'local',
  name: 'Hash Generator',
  description: 'Membuat hash teks menggunakan Web Crypto tanpa mengirim data ke jaringan.',
  category: 'Security & Random',
  tags: ['hash', 'sha256', 'sha384', 'sha512', 'checksum', 'security', 'offline'],
  icon: '#H',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'text',
        type: 'multiline-text',
        label: 'Teks input',
        required: false,
        placeholder: 'Masukkan teks yang ingin di-hash...',
        helpText: 'Teks kosong tetap dapat menghasilkan hash yang valid.',
      },
      {
        id: 'algorithm',
        type: 'enum',
        label: 'Algoritma',
        required: true,
        defaultValue: 'SHA-256',
        options: HASH_ALGORITHMS.map((algorithm) => ({
          value: algorithm,
          label: algorithm,
        })),
      },
      {
        id: 'encoding',
        type: 'enum',
        label: 'Output encoding',
        required: true,
        defaultValue: 'hex',
        options: [
          { value: 'hex', label: 'Hexadecimal' },
          { value: 'base64', label: 'Base64' },
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
  executorRef: 'built-in.local.hash-generator',
  primaryActionLabel: 'Generate hash',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return globalThis.btoa(binary)
}

export async function hashText(
  text: string,
  algorithm: HashAlgorithm,
  encoding: HashEncoding,
): Promise<string> {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto tidak tersedia pada browser ini.')
  }

  const digest = await cryptoApi.subtle.digest(algorithm, new TextEncoder().encode(text))
  const bytes = new Uint8Array(digest)
  return encoding === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes)
}

function validateHashInput(input: GeneratorInput): ValidationResult {
  if (typeof input.text !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-text', 'text', 'Teks input harus berupa teks.')],
    }
  }

  if (
    typeof input.algorithm !== 'string' ||
    !HASH_ALGORITHMS.includes(input.algorithm as HashAlgorithm)
  ) {
    return {
      valid: false,
      issues: [createIssue('invalid-algorithm', 'algorithm', 'Pilih algoritma hash yang tersedia.')],
    }
  }

  if (
    typeof input.encoding !== 'string' ||
    !HASH_ENCODINGS.includes(input.encoding as HashEncoding)
  ) {
    return {
      valid: false,
      issues: [createIssue('invalid-encoding', 'encoding', 'Pilih encoding output yang tersedia.')],
    }
  }

  return { valid: true, issues: [] }
}

export const hashGenerator: GeneratorModule = {
  definition,

  validate: validateHashInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateHashInput(input)
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
      const content = await hashText(
        input.text as string,
        input.algorithm as HashAlgorithm,
        input.encoding as HashEncoding,
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
          code: 'crypto-unavailable',
          fieldId: 'text',
          retryable: false,
          userMessage: 'Web Crypto tidak tersedia untuk membuat hash pada browser ini.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
