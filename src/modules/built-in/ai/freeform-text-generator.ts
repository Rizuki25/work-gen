import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  GeneratorExecutionContext,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const TONES = ['neutral', 'professional', 'friendly', 'formal', 'direct'] as const
type Tone = (typeof TONES)[number]

const LENGTHS = ['short', 'medium', 'long'] as const
type OutputLength = (typeof LENGTHS)[number]

const OUTPUT_FORMATS = ['plain-text', 'markdown'] as const
type OutputFormat = (typeof OUTPUT_FORMATS)[number]

const TEMPLATE_VERSION = 'freeform-text.v1'

interface FreeformTextInput {
  readonly instruction: string
  readonly context?: string
  readonly tone: Tone
  readonly length: OutputLength
  readonly format: OutputFormat
}

const definition: GeneratorDefinition = {
  id: 'ai.freeform-text',
  kind: 'ai',
  name: 'Freeform Text',
  description: 'Membuat teks dari instruksi dengan provider AI pilihan Anda.',
  category: 'AI',
  tags: ['ai', 'writing', 'freeform', 'text', 'provider', 'online'],
  icon: 'AI',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'instruction',
        type: 'multiline-text',
        label: 'Instruksi',
        required: true,
        placeholder: 'Tulis email singkat untuk meminta review dokumen sebelum Jumat.',
        helpText: 'Jelaskan hasil yang Anda butuhkan dengan konteks dan batasan yang relevan.',
      },
      {
        id: 'context',
        type: 'multiline-text',
        label: 'Konteks (opsional)',
        required: false,
        placeholder: 'Dokumen sudah diperbarui; penerima adalah lead tim.',
        helpText: 'Konteks ini akan dikirim bersama instruksi setelah Anda menyetujui data boundary.',
      },
      {
        id: 'tone',
        type: 'enum',
        label: 'Tone',
        required: true,
        defaultValue: 'neutral',
        options: [
          { value: 'neutral', label: 'Neutral' },
          { value: 'professional', label: 'Professional' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'formal', label: 'Formal' },
          { value: 'direct', label: 'Direct' },
        ],
      },
      {
        id: 'length',
        type: 'enum',
        label: 'Panjang output',
        required: true,
        defaultValue: 'medium',
        options: [
          { value: 'short', label: 'Short' },
          { value: 'medium', label: 'Medium' },
          { value: 'long', label: 'Long' },
        ],
      },
      {
        id: 'format',
        type: 'enum',
        label: 'Format output',
        required: true,
        defaultValue: 'plain-text',
        options: [
          { value: 'plain-text', label: 'Plain text' },
          { value: 'markdown', label: 'Markdown' },
        ],
        helpText: 'Hasil tetap dapat diedit sebelum disalin atau diunduh.',
      },
    ],
  },
  outputTypes: ['plain-text', 'markdown'],
  capabilities: {
    offline: false,
    copy: true,
    download: true,
    network: true,
    cancellation: false,
  },
  executorRef: 'built-in.ai.freeform-text',
  primaryActionLabel: 'Generate with AI',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string | undefined, message: string): ValidationIssue {
  return { code, ...(fieldId === undefined ? {} : { fieldId }), message }
}

function cleanText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function validateFreeformInput(input: GeneratorInput): ValidationResult {
  if (cleanText(input.instruction) === undefined) {
    return {
      valid: false,
      issues: [createIssue('required', 'instruction', 'Instruksi wajib diisi.')],
    }
  }

  if (input.context !== undefined && typeof input.context !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-text', 'context', 'Konteks harus berupa teks.')],
    }
  }

  if (typeof input.tone !== 'string' || !TONES.includes(input.tone as Tone)) {
    return {
      valid: false,
      issues: [createIssue('invalid-tone', 'tone', 'Pilih tone yang tersedia.')],
    }
  }

  if (typeof input.length !== 'string' || !LENGTHS.includes(input.length as OutputLength)) {
    return {
      valid: false,
      issues: [createIssue('invalid-length', 'length', 'Pilih panjang output yang tersedia.')],
    }
  }

  if (typeof input.format !== 'string' || !OUTPUT_FORMATS.includes(input.format as OutputFormat)) {
    return {
      valid: false,
      issues: [createIssue('invalid-format', 'format', 'Pilih format plain text atau Markdown.')],
    }
  }

  return { valid: true, issues: [] }
}

function maxOutputTokens(length: OutputLength): number {
  switch (length) {
    case 'short':
      return 512
    case 'long':
      return 2048
    default:
      return 1024
  }
}

export function buildFreeformMessages(input: FreeformTextInput) {
  const context = cleanText(input.context)
  const formatInstruction = input.format === 'markdown'
    ? 'Gunakan Markdown sederhana jika heading atau daftar membantu.'
    : 'Kembalikan plain text tanpa Markdown.'

  return [
    {
      role: 'system' as const,
      content: 'Anda adalah asisten penulisan WorkGen. Ikuti instruksi pengguna dan jangan menambahkan klaim yang tidak didukung konteks.',
    },
    {
      role: 'user' as const,
      content: [
        `Instruksi:\n${input.instruction.trim()}`,
        context ? `Konteks:\n${context}` : undefined,
        `Tone: ${input.tone}`,
        `Panjang: ${input.length}`,
        `Format: ${formatInstruction}`,
      ].filter((section): section is string => section !== undefined).join('\n\n'),
    },
  ]
}

export const freeformTextGenerator: GeneratorModule = {
  definition,

  validate: validateFreeformInput,

  async execute(input: GeneratorInput, context: GeneratorExecutionContext): Promise<GeneratorResult> {
    const validation = validateFreeformInput(input)
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

    if (!context.ai || !context.ai.provider) {
      return {
        status: 'failed',
        error: {
          code: 'provider-required',
          retryable: false,
          userMessage: 'Pilih dan konfigurasi provider AI di Settings terlebih dahulu.',
        },
      }
    }

    if (context.aiConsentGiven !== true) {
      return {
        status: 'failed',
        error: {
          code: 'consent-required',
          retryable: false,
          userMessage: 'Setujui data boundary sebelum mengirim instruksi ke provider AI.',
        },
      }
    }

    const freeformInput: FreeformTextInput = {
      instruction: input.instruction as string,
      context: input.context as string | undefined,
      tone: input.tone as Tone,
      length: input.length as OutputLength,
      format: input.format as OutputFormat,
    }
    const result = await context.ai.generate({
      messages: buildFreeformMessages(freeformInput),
      consentGiven: true,
      maxOutputTokens: maxOutputTokens(freeformInput.length),
      temperature: 0.4,
    })

    if (result.status === 'failed') {
      return {
        status: 'failed',
        error: {
          code: result.error.code,
          retryable: result.error.retryable,
          userMessage: result.error.userMessage,
        },
      }
    }

    return {
      status: 'success',
      output: {
        type: freeformInput.format,
        mimeType: freeformInput.format === 'markdown'
          ? 'text/markdown;charset=utf-8'
          : 'text/plain;charset=utf-8',
        content: result.text,
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
