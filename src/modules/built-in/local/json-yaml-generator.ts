import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const CONVERSION_MODES = ['json-to-yaml', 'yaml-to-json'] as const
type ConversionMode = (typeof CONVERSION_MODES)[number]

const definition: GeneratorDefinition = {
  id: 'local.json-yaml',
  kind: 'local',
  name: 'JSON ↔ YAML Converter',
  description: 'Mengubah JSON dan YAML secara lokal dengan output yang terformat.',
  category: 'Data & Conversion',
  tags: ['json', 'yaml', 'convert', 'format', 'configuration', 'offline'],
  icon: '↔',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'mode',
        type: 'enum',
        label: 'Mode konversi',
        required: true,
        defaultValue: 'json-to-yaml',
        options: [
          { value: 'json-to-yaml', label: 'JSON → YAML' },
          { value: 'yaml-to-json', label: 'YAML → JSON' },
        ],
      },
      {
        id: 'value',
        type: 'multiline-text',
        label: 'Input data',
        required: true,
        placeholder: '{"name":"WorkGen","offline":true}',
        helpText: 'Input diproses sepenuhnya di browser.',
      },
    ],
  },
  outputTypes: ['json', 'yaml', 'plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.json-yaml',
  primaryActionLabel: 'Convert format',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

export function convertJsonToYaml(source: string): string {
  const parsed: unknown = JSON.parse(source)
  return stringifyYaml(parsed, { indent: 2, lineWidth: 0 })
}

export function convertYamlToJson(source: string): string {
  const parsed: unknown = parseYaml(source)
  const formatted = JSON.stringify(parsed, null, 2)

  if (formatted === undefined) {
    throw new Error('YAML tidak menghasilkan nilai JSON yang dapat ditampilkan.')
  }

  return formatted
}

function validateConversionInput(input: GeneratorInput): ValidationResult {
  const mode = input.mode
  if (typeof mode !== 'string' || !CONVERSION_MODES.includes(mode as ConversionMode)) {
    return {
      valid: false,
      issues: [createIssue('invalid-mode', 'mode', 'Pilih mode konversi JSON atau YAML.')],
    }
  }

  const value = input.value
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      valid: false,
      issues: [createIssue('required', 'value', 'Input data wajib diisi.')],
    }
  }

  try {
    if (mode === 'json-to-yaml') {
      convertJsonToYaml(value)
    } else {
      convertYamlToJson(value)
    }
  } catch {
    return {
      valid: false,
      issues: [
        createIssue(
          mode === 'json-to-yaml' ? 'invalid-json' : 'invalid-yaml',
          'value',
          mode === 'json-to-yaml'
            ? 'JSON tidak valid. Periksa struktur, koma, dan tanda kutip.'
            : 'YAML tidak valid. Periksa indentasi dan struktur key-value.',
        ),
      ],
    }
  }

  return { valid: true, issues: [] }
}

export const jsonYamlGenerator: GeneratorModule = {
  definition,

  validate: validateConversionInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateConversionInput(input)
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

    const mode = input.mode as ConversionMode
    const value = input.value as string

    try {
      if (mode === 'json-to-yaml') {
        return {
          status: 'success',
          output: {
            type: 'yaml',
            mimeType: 'application/yaml;charset=utf-8',
            content: convertJsonToYaml(value),
          },
        }
      }

      return {
        status: 'success',
        output: {
          type: 'json',
          mimeType: 'application/json;charset=utf-8',
          content: convertYamlToJson(value),
        },
      }
    } catch {
      return {
        status: 'failed',
        error: {
          code: 'conversion-failed',
          fieldId: 'value',
          retryable: false,
          userMessage: 'Data tidak dapat dikonversi. Periksa input kembali.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
