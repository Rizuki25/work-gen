import type {
  GeneratorDefinition,
  GeneratorModule,
  GeneratorInput,
  GeneratorResult,
} from '../../contracts/generator'

const definition: GeneratorDefinition = {
  id: 'local.text-echo',
  kind: 'local',
  name: 'Text Echo (Demo)',
  description: 'Generator demo untuk memverifikasi alur input dan output lokal.',
  category: 'Text & Format',
  tags: ['demo', 'text', 'offline'],
  icon: 'T',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'text',
        type: 'multiline-text',
        label: 'Teks input',
        required: true,
        placeholder: 'Ketik teks untuk menguji generator lokal...',
        helpText: 'Teks ini diproses sepenuhnya di browser.',
      },
    ],
  },
  outputTypes: ['plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: false,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.text-echo',
  enabled: true,
  featured: true,
}

export const dummyTextGenerator: GeneratorModule = {
  definition,

  validate(input: GeneratorInput) {
    const value = input.text

    if (typeof value !== 'string' || value.trim().length === 0) {
      return {
        valid: false,
        issues: [
          {
            code: 'required',
            fieldId: 'text',
            message: 'Teks input wajib diisi.',
          },
        ],
      }
    }

    return { valid: true, issues: [] }
  },

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const value = input.text

    if (typeof value !== 'string' || value.trim().length === 0) {
      return {
        status: 'failed',
        error: {
          code: 'required',
          fieldId: 'text',
          retryable: false,
          userMessage: 'Teks input wajib diisi.',
        },
      }
    }

    return {
      status: 'success',
      output: {
        type: 'plain-text',
        mimeType: 'text/plain;charset=utf-8',
        content: value,
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
