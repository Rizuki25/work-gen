import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const TONES = ['professional', 'formal', 'friendly', 'direct'] as const
type EmailTone = (typeof TONES)[number]

const OUTPUT_FORMATS = ['markdown', 'plain-text'] as const
type OutputFormat = (typeof OUTPUT_FORMATS)[number]

const TEMPLATE_VERSION = 'business-email.v1'

export interface BusinessEmailInput {
  readonly purpose: string
  readonly recipients?: string
  readonly subject: string
  readonly context: string
  readonly mainPoints: string
  readonly callToAction?: string
  readonly tone: EmailTone
}

interface ToneCopy {
  readonly greeting: (recipient: string) => string
  readonly introduction: (purpose: string) => string
  readonly closing: string
  readonly fallbackCallToAction: string
}

const TONE_COPY: Record<EmailTone, ToneCopy> = {
  professional: {
    greeting: (recipient) => `Halo ${recipient},`,
    introduction: (purpose) => `Saya menghubungi Anda terkait ${purpose}.`,
    closing: 'Terima kasih,',
    fallbackCallToAction: 'Mohon beri kabar jika ada tindak lanjut yang diperlukan.',
  },
  formal: {
    greeting: (recipient) => `Yth. ${recipient},`,
    introduction: (purpose) => `Dengan hormat, saya menyampaikan informasi terkait ${purpose}.`,
    closing: 'Hormat saya,',
    fallbackCallToAction: 'Mohon konfirmasi dan tindak lanjut sesuai kebutuhan.',
  },
  friendly: {
    greeting: (recipient) => `Hai ${recipient},`,
    introduction: (purpose) => `Saya ingin berbagi informasi terkait ${purpose}.`,
    closing: 'Salam,',
    fallbackCallToAction: 'Boleh kabari saya jika ada pertanyaan atau masukan.',
  },
  direct: {
    greeting: (recipient) => `Halo ${recipient},`,
    introduction: (purpose) => `Terkait ${purpose}, berikut informasi utamanya.`,
    closing: 'Terima kasih.',
    fallbackCallToAction: 'Mohon lakukan tindak lanjut yang diperlukan.',
  },
}

const definition: GeneratorDefinition = {
  id: 'template.business-email',
  kind: 'template',
  name: 'Business Email',
  description: 'Membuat draft email kerja konsisten dengan tone lokal tanpa AI.',
  category: 'Reports',
  tags: ['email', 'business', 'template', 'tone', 'markdown', 'offline'],
  icon: '@',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'purpose',
        type: 'string',
        label: 'Tujuan email',
        required: true,
        placeholder: 'Permintaan review dokumen',
        helpText: 'Tujuan ini digunakan untuk membentuk kalimat pembuka email.',
      },
      {
        id: 'recipients',
        type: 'string',
        label: 'Penerima (opsional)',
        required: false,
        placeholder: 'Nama penerima atau Tim terkait',
        helpText: 'Jika kosong, output menggunakan "Tim terkait".',
      },
      {
        id: 'subject',
        type: 'string',
        label: 'Subjek',
        required: true,
        placeholder: 'Mohon review dokumen sebelum Jumat',
      },
      {
        id: 'context',
        type: 'multiline-text',
        label: 'Konteks',
        required: true,
        placeholder: 'Jelaskan konteks singkat agar penerima memahami situasinya...',
        helpText: 'Tulis latar belakang atau informasi yang perlu diketahui penerima.',
      },
      {
        id: 'mainPoints',
        type: 'multiline-text',
        label: 'Poin utama',
        required: true,
        placeholder: 'Dokumen sudah diperbarui\nBagian risiko perlu diperiksa',
        helpText: 'Satu poin per baris; output akan diberi bullet otomatis.',
      },
      {
        id: 'callToAction',
        type: 'multiline-text',
        label: 'Call to action (opsional)',
        required: false,
        placeholder: 'Mohon konfirmasi sebelum Jumat',
        helpText: 'Jika kosong, template akan memakai call to action sesuai tone.',
        hintByFieldValue: {
          fieldId: 'tone',
          values: {
            professional: {
              placeholder: 'Mohon konfirmasi sebelum Jumat',
              helpText: 'CTA profesional dan jelas; jika kosong, fallback tone digunakan.',
            },
            formal: {
              placeholder: 'Mohon dapat dikonfirmasi sebelum Jumat',
              helpText: 'CTA formal; jika kosong, fallback tone digunakan.',
            },
            friendly: {
              placeholder: 'Boleh kabari saya sebelum Jumat?',
              helpText: 'CTA ramah; jika kosong, fallback tone digunakan.',
            },
            direct: {
              placeholder: 'Konfirmasi sebelum Jumat',
              helpText: 'CTA langsung; jika kosong, fallback tone digunakan.',
            },
          },
        },
      },
      {
        id: 'tone',
        type: 'enum',
        label: 'Tone',
        required: true,
        defaultValue: 'professional',
        options: [
          { value: 'professional', label: 'Professional' },
          { value: 'formal', label: 'Formal' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'direct', label: 'Direct' },
        ],
        helpText: 'Tone hanya mengubah template lokal; AI tidak digunakan.',
      },
      {
        id: 'format',
        type: 'enum',
        label: 'Format output',
        required: true,
        defaultValue: 'markdown',
        options: [
          { value: 'markdown', label: 'Markdown' },
          { value: 'plain-text', label: 'Plain text' },
        ],
        helpText: 'Output memuat subjek dan isi email.',
      },
    ],
  },
  outputTypes: ['markdown', 'plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.template.business-email',
  primaryActionLabel: 'Generate email',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function cleanLines(value: string | undefined): string[] {
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/\r\n|\r|\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function formatList(value: string): string {
  const lines = cleanLines(value)
  return lines.length === 0
    ? 'Tidak ada'
    : lines.map((line) => /^[-*+]\s+/u.test(line) ? line : `- ${line}`).join('\n')
}

function formatParagraph(value: string): string {
  const lines = cleanLines(value)
  return lines.length === 0 ? 'Tidak ada' : lines.join('\n')
}

function displayRecipient(value: string | undefined): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Tim terkait'
}

function displayCallToAction(input: BusinessEmailInput, copy: ToneCopy): string {
  const value = formatParagraph(input.callToAction ?? '')
  return value === 'Tidak ada' ? copy.fallbackCallToAction : value
}

function buildEmailBody(input: BusinessEmailInput): string[] {
  const copy = TONE_COPY[input.tone]
  const recipient = displayRecipient(input.recipients)

  return [
    copy.greeting(recipient),
    '',
    copy.introduction(input.purpose.trim()),
    '',
    formatParagraph(input.context),
    '',
    'Poin utama:',
    formatList(input.mainPoints),
    '',
    'Tindak lanjut yang diharapkan:',
    displayCallToAction(input, copy),
    '',
    copy.closing,
  ]
}

function formatMarkdown(input: BusinessEmailInput): string {
  return [
    `**Subject:** ${input.subject.trim()}`,
    `**To:** ${displayRecipient(input.recipients)}`,
    '',
    ...buildEmailBody(input),
  ].join('\n')
}

function formatPlainText(input: BusinessEmailInput): string {
  return [
    `SUBJECT: ${input.subject.trim()}`,
    `TO: ${displayRecipient(input.recipients)}`,
    '',
    ...buildEmailBody(input),
  ].join('\n')
}

export function renderBusinessEmail(
  input: BusinessEmailInput,
  format: OutputFormat,
): string {
  return format === 'markdown' ? formatMarkdown(input) : formatPlainText(input)
}

function validateBusinessEmailInput(input: GeneratorInput): ValidationResult {
  const requiredFields: Array<{ id: string; label: string }> = [
    { id: 'purpose', label: 'Tujuan email' },
    { id: 'subject', label: 'Subjek' },
    { id: 'context', label: 'Konteks' },
    { id: 'mainPoints', label: 'Poin utama' },
  ]

  for (const field of requiredFields) {
    const value = input[field.id]
    if (typeof value !== 'string' || value.trim().length === 0) {
      return {
        valid: false,
        issues: [createIssue('required', field.id, `${field.label} wajib diisi.`)],
      }
    }
  }

  for (const fieldId of ['recipients', 'callToAction'] as const) {
    if (input[fieldId] !== undefined && typeof input[fieldId] !== 'string') {
      return {
        valid: false,
        issues: [createIssue('invalid-text', fieldId, 'Nilai field harus berupa teks.')],
      }
    }
  }

  if (typeof input.tone !== 'string' || !TONES.includes(input.tone as EmailTone)) {
    return {
      valid: false,
      issues: [createIssue('invalid-tone', 'tone', 'Pilih tone email yang tersedia.')],
    }
  }

  if (
    typeof input.format !== 'string' ||
    !OUTPUT_FORMATS.includes(input.format as OutputFormat)
  ) {
    return {
      valid: false,
      issues: [createIssue('invalid-format', 'format', 'Pilih format Markdown atau plain text.')],
    }
  }

  return { valid: true, issues: [] }
}

export const businessEmailGenerator: GeneratorModule = {
  definition,

  validate: validateBusinessEmailInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateBusinessEmailInput(input)
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

    const emailInput: BusinessEmailInput = {
      purpose: input.purpose as string,
      recipients: input.recipients as string | undefined,
      subject: input.subject as string,
      context: input.context as string,
      mainPoints: input.mainPoints as string,
      callToAction: input.callToAction as string | undefined,
      tone: input.tone as EmailTone,
    }
    const format = input.format as OutputFormat

    return {
      status: 'success',
      output: {
        type: format,
        mimeType: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
        content: renderBusinessEmail(emailInput, format),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
