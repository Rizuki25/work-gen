import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const OUTPUT_FORMATS = ['markdown', 'plain-text'] as const
type OutputFormat = (typeof OUTPUT_FORMATS)[number]

const TEMPLATE_VERSION = 'meeting-minutes.v1'

export interface MeetingMinutesInput {
  readonly title: string
  readonly date: string
  readonly participants: string
  readonly agenda: string
  readonly discussion: string
  readonly decisions?: string
  readonly actionItems?: string
  readonly owner?: string
  readonly dueDate?: string
}

const definition: GeneratorDefinition = {
  id: 'template.meeting-minutes',
  kind: 'template',
  name: 'Meeting Minutes',
  description: 'Membuat notulen rapat konsisten dari form lokal tanpa AI.',
  category: 'Reports',
  tags: ['meeting', 'minutes', 'notulen', 'template', 'markdown', 'offline'],
  icon: 'MM',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'title',
        type: 'string',
        label: 'Judul rapat',
        required: true,
        placeholder: 'Sprint Planning - Minggu 32',
      },
      {
        id: 'date',
        type: 'date',
        label: 'Tanggal',
        required: true,
        defaultValue: new Date().toISOString().slice(0, 10),
        helpText: 'Tanggal rapat yang akan ditampilkan pada output.',
      },
      {
        id: 'participants',
        type: 'multiline-text',
        label: 'Peserta',
        required: true,
        placeholder: 'Ayu\nBima\nCitra',
        helpText: 'Satu peserta per baris; output akan diberi bullet otomatis.',
      },
      {
        id: 'agenda',
        type: 'multiline-text',
        label: 'Agenda',
        required: true,
        placeholder: 'Review progres\nBahas risiko',
        helpText: 'Satu agenda per baris.',
      },
      {
        id: 'discussion',
        type: 'multiline-text',
        label: 'Pembahasan',
        required: true,
        placeholder: 'Tuliskan ringkasan pembahasan dan konteks penting...',
        helpText: 'Tulis ringkasan; baris baru akan dipertahankan pada output.',
      },
      {
        id: 'decisions',
        type: 'multiline-text',
        label: 'Keputusan',
        required: false,
        placeholder: 'Keputusan yang disepakati',
        helpText: 'Boleh dikosongkan jika belum ada keputusan.',
      },
      {
        id: 'actionItems',
        type: 'multiline-text',
        label: 'Action items',
        required: false,
        placeholder: 'Siapkan draft laporan\nJadwalkan follow-up',
        helpText: 'Satu action item per baris.',
      },
      {
        id: 'owner',
        type: 'string',
        label: 'Owner',
        required: false,
        placeholder: 'Nama penanggung jawab utama',
      },
      {
        id: 'dueDate',
        type: 'date',
        label: 'Due date',
        required: false,
        helpText: 'Opsional; tanggal target action item atau follow-up.',
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
        helpText: 'Template dirender lokal; tidak ada request AI atau network.',
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
  executorRef: 'built-in.template.meeting-minutes',
  primaryActionLabel: 'Generate minutes',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day!))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  )
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

function formatList(value: string | undefined): string {
  const lines = cleanLines(value)
  if (lines.length === 0) {
    return 'Tidak ada'
  }

  return lines
    .map((line) => /^[-*+]\s+/u.test(line) ? line : `- ${line}`)
    .join('\n')
}

function formatParagraph(value: string): string {
  const lines = cleanLines(value)
  return lines.length > 0 ? lines.join('\n') : 'Tidak ada'
}

function displayValue(value: string | undefined): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Tidak ada'
}

function formatMarkdown(input: MeetingMinutesInput): string {
  return [
    `# Meeting Minutes - ${input.title.trim()}`,
    '',
    `**Tanggal:** ${input.date}`,
    `**Owner:** ${displayValue(input.owner)}`,
    `**Due date:** ${displayValue(input.dueDate)}`,
    '',
    '## Peserta',
    formatList(input.participants),
    '',
    '## Agenda',
    formatList(input.agenda),
    '',
    '## Pembahasan',
    formatParagraph(input.discussion),
    '',
    '## Keputusan',
    formatList(input.decisions),
    '',
    '## Action items',
    formatList(input.actionItems),
  ].join('\n')
}

function formatPlainText(input: MeetingMinutesInput): string {
  return [
    'MEETING MINUTES',
    '===============',
    '',
    `Judul: ${input.title.trim()}`,
    `Tanggal: ${input.date}`,
    `Owner: ${displayValue(input.owner)}`,
    `Due date: ${displayValue(input.dueDate)}`,
    '',
    'PESERTA',
    '--------',
    formatList(input.participants),
    '',
    'AGENDA',
    '------',
    formatList(input.agenda),
    '',
    'PEMBAHASAN',
    '-----------',
    formatParagraph(input.discussion),
    '',
    'KEPUTUSAN',
    '---------',
    formatList(input.decisions),
    '',
    'ACTION ITEMS',
    '------------',
    formatList(input.actionItems),
  ].join('\n')
}

export function renderMeetingMinutes(
  input: MeetingMinutesInput,
  format: OutputFormat,
): string {
  return format === 'markdown' ? formatMarkdown(input) : formatPlainText(input)
}

function validateMeetingMinutesInput(input: GeneratorInput): ValidationResult {
  const requiredFields: Array<{ id: keyof MeetingMinutesInput; label: string }> = [
    { id: 'title', label: 'Judul rapat' },
    { id: 'date', label: 'Tanggal' },
    { id: 'participants', label: 'Peserta' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'discussion', label: 'Pembahasan' },
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

  if (!isValidDate(input.date as string)) {
    return {
      valid: false,
      issues: [createIssue('invalid-date', 'date', 'Tanggal rapat tidak valid.')],
    }
  }

  if (input.dueDate !== undefined && input.dueDate !== '' && typeof input.dueDate !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-text', 'dueDate', 'Due date harus berupa tanggal.')],
    }
  }

  if (typeof input.dueDate === 'string' && input.dueDate !== '' && !isValidDate(input.dueDate)) {
    return {
      valid: false,
      issues: [createIssue('invalid-date', 'dueDate', 'Due date tidak valid.')],
    }
  }

  for (const fieldId of ['decisions', 'actionItems', 'owner'] as const) {
    if (input[fieldId] !== undefined && typeof input[fieldId] !== 'string') {
      return {
        valid: false,
        issues: [createIssue('invalid-text', fieldId, 'Nilai field harus berupa teks.')],
      }
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

export const meetingMinutesGenerator: GeneratorModule = {
  definition,

  validate: validateMeetingMinutesInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateMeetingMinutesInput(input)
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

    const minutesInput: MeetingMinutesInput = {
      title: input.title as string,
      date: input.date as string,
      participants: input.participants as string,
      agenda: input.agenda as string,
      discussion: input.discussion as string,
      decisions: input.decisions as string | undefined,
      actionItems: input.actionItems as string | undefined,
      owner: input.owner as string | undefined,
      dueDate: input.dueDate as string | undefined,
    }
    const format = input.format as OutputFormat

    return {
      status: 'success',
      output: {
        type: format,
        mimeType: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
        content: renderMeetingMinutes(minutesInput, format),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
