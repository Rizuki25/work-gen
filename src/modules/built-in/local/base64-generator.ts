import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const BASE64_MODES = ['encode', 'decode'] as const
type Base64Mode = (typeof BASE64_MODES)[number]

const definition: GeneratorDefinition = {
  id: 'local.base64',
  kind: 'local',
  name: 'Base64 Encoder/Decoder',
  description: 'Encode atau decode teks Base64 dengan dukungan karakter Unicode.',
  category: 'Data & Conversion',
  tags: ['base64', 'encode', 'decode', 'text', 'conversion', 'offline'],
  icon: '64',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'mode',
        type: 'enum',
        label: 'Mode',
        required: true,
        defaultValue: 'encode',
        options: [
          { value: 'encode', label: 'Encode ke Base64' },
          { value: 'decode', label: 'Decode dari Base64' },
        ],
      },
      {
        id: 'text',
        type: 'multiline-text',
        label: 'Teks input',
        required: true,
        placeholder: 'Masukkan teks atau nilai Base64...',
        helpText: 'Encoding menggunakan UTF-8; whitespace pada Base64 decode diabaikan.',
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
  executorRef: 'built-in.local.base64',
  primaryActionLabel: 'Process Base64',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return globalThis.btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/\s+/g, '')
  const hasValidCharacters = /^[A-Za-z0-9+/]*={0,2}$/.test(normalized)
  const hasValidLength = normalized.length % 4 !== 1
  const hasValidPadding = !normalized.includes('=') || normalized.length % 4 === 0

  if (!hasValidCharacters || !hasValidLength || !hasValidPadding) {
    throw new Error('Base64 memiliki format yang tidak valid.')
  }

  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = globalThis.atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function encodeBase64Text(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text))
}

export function decodeBase64Text(value: string): string {
  const bytes = base64ToBytes(value)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function validateBase64Input(input: GeneratorInput): ValidationResult {
  const mode = input.mode
  if (typeof mode !== 'string' || !BASE64_MODES.includes(mode as Base64Mode)) {
    return {
      valid: false,
      issues: [createIssue('invalid-mode', 'mode', 'Pilih mode Encode atau Decode.')],
    }
  }

  const text = input.text
  if (typeof text !== 'string' || text.length === 0) {
    return {
      valid: false,
      issues: [createIssue('required', 'text', 'Teks input wajib diisi.')],
    }
  }

  if (mode === 'decode') {
    try {
      decodeBase64Text(text)
    } catch {
      return {
        valid: false,
        issues: [
          createIssue(
            'invalid-base64',
            'text',
            'Base64 tidak valid atau hasil decode bukan teks UTF-8.',
          ),
        ],
      }
    }
  }

  return { valid: true, issues: [] }
}

export const base64Generator: GeneratorModule = {
  definition,

  validate: validateBase64Input,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateBase64Input(input)
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

    const mode = input.mode as Base64Mode
    const text = input.text as string

    try {
      const content = mode === 'encode' ? encodeBase64Text(text) : decodeBase64Text(text)
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
          code: 'base64-processing-failed',
          fieldId: 'text',
          retryable: false,
          userMessage: 'Base64 tidak dapat diproses. Periksa input dan mode yang dipilih.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
