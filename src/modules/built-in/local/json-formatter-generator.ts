import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
} from '../../contracts/generator'

const definition: GeneratorDefinition = {
  id: 'local.json-formatter',
  kind: 'local',
  name: 'JSON Formatter/Validator',
  description: 'Memformat JSON dan memvalidasi kesalahan sintaks secara lokal.',
  category: 'Text & Format',
  tags: ['json', 'format', 'validate', 'pretty print', 'offline'],
  icon: '{}',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'json',
        type: 'multiline-text',
        label: 'JSON input',
        required: true,
        placeholder: '{"name":"WorkGen","offline":true}',
        helpText: 'JSON diproses sepenuhnya di browser dan tidak dikirim ke jaringan.',
      },
    ],
  },
  outputTypes: ['json'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.json-formatter',
  enabled: true,
  featured: true,
}

function getErrorLocation(error: unknown, source: string): string | undefined {
  const message = error instanceof Error ? error.message : ''
  const positionMatch = message.match(/position\s+(\d+)/i)

  if (positionMatch) {
    const position = Number(positionMatch[1])

    if (Number.isFinite(position)) {
      const line = source.slice(0, position).split(/\r?\n/).length
      const lastLineBreak = Math.max(
        source.lastIndexOf('\n', position - 1),
        source.lastIndexOf('\r', position - 1),
      )
      const column = position - lastLineBreak
      return `baris ${line}, kolom ${column}`
    }
  }

  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  if (lineColumnMatch) {
    return `baris ${lineColumnMatch[1]}, kolom ${lineColumnMatch[2]}`
  }

  return undefined
}

function invalidJsonIssue(source: string, error: unknown): ValidationIssue {
  const location = getErrorLocation(error, source)

  return {
    code: 'invalid-json',
    fieldId: 'json',
    message: location
      ? `JSON tidak valid di ${location}. Periksa tanda kurung, koma, dan tanda kutip.`
      : 'JSON tidak valid. Periksa tanda kurung, koma, dan tanda kutip.',
  }
}

export function formatJson(source: string): string {
  const parsed: unknown = JSON.parse(source)
  const formatted = JSON.stringify(parsed, null, 2)

  if (formatted === undefined) {
    throw new Error('JSON tidak dapat diformat.')
  }

  return formatted
}

export const jsonFormatterGenerator: GeneratorModule = {
  definition,

  validate(input: GeneratorInput) {
    const source = input.json

    if (typeof source !== 'string' || source.trim().length === 0) {
      return {
        valid: false,
        issues: [
          {
            code: 'required',
            fieldId: 'json',
            message: 'JSON input wajib diisi.',
          },
        ],
      }
    }

    try {
      formatJson(source)
      return { valid: true, issues: [] }
    } catch (error) {
      return { valid: false, issues: [invalidJsonIssue(source, error)] }
    }
  },

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const source = input.json

    if (typeof source !== 'string' || source.trim().length === 0) {
      return {
        status: 'failed',
        error: {
          code: 'required',
          fieldId: 'json',
          retryable: false,
          userMessage: 'JSON input wajib diisi.',
        },
      }
    }

    try {
      return {
        status: 'success',
        output: {
          type: 'json',
          mimeType: 'application/json;charset=utf-8',
          content: formatJson(source),
        },
      }
    } catch (error) {
      const issue = invalidJsonIssue(source, error)
      return {
        status: 'failed',
        error: {
          code: issue.code,
          fieldId: issue.fieldId,
          retryable: false,
          userMessage: issue.message,
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
