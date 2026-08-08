import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const REPORT_FORMATS = ['markdown', 'plain-text'] as const
type ReportFormat = (typeof REPORT_FORMATS)[number]

const TEMPLATE_VERSION = 'daily-report.v1'

export interface DailyReportInput {
  readonly date: string
  readonly name: string
  readonly team: string
  readonly completed: string
  readonly inProgress?: string
  readonly blockers?: string
  readonly nextPlan: string
}

const definition: GeneratorDefinition = {
  id: 'template.daily-report',
  kind: 'template',
  name: 'Daily Report',
  description: 'Membuat laporan harian konsisten dari form lokal tanpa AI.',
  category: 'Reports',
  tags: ['daily', 'report', 'template', 'markdown', 'plain-text', 'offline'],
  icon: 'DR',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'date',
        type: 'date',
        label: 'Tanggal',
        required: true,
        defaultValue: new Date().toISOString().slice(0, 10),
        helpText: 'Tanggal laporan yang akan ditampilkan pada output.',
      },
      {
        id: 'name',
        type: 'string',
        label: 'Nama',
        required: true,
        placeholder: 'Nama Anda',
      },
      {
        id: 'team',
        type: 'string',
        label: 'Tim',
        required: true,
        placeholder: 'Nama tim atau unit kerja',
      },
      {
        id: 'completed',
        type: 'multiline-text',
        label: 'Pekerjaan selesai',
        required: true,
        placeholder: 'Selesaikan satu pekerjaan\nPerbarui dokumentasi',
        helpText: 'Satu item per baris; output akan diberi bullet otomatis.',
      },
      {
        id: 'inProgress',
        type: 'multiline-text',
        label: 'Pekerjaan berjalan',
        required: false,
        placeholder: 'Pekerjaan yang masih berlangsung',
        helpText: 'Boleh dikosongkan jika tidak ada pekerjaan berjalan.',
      },
      {
        id: 'blockers',
        type: 'multiline-text',
        label: 'Kendala',
        required: false,
        placeholder: 'Kendala atau dependensi yang perlu dicatat',
        helpText: 'Boleh dikosongkan; bagian ini akan menampilkan "Tidak ada".',
      },
      {
        id: 'nextPlan',
        type: 'multiline-text',
        label: 'Rencana berikutnya',
        required: true,
        placeholder: 'Lanjutkan pekerjaan utama\nTindak lanjuti dependensi',
        helpText: 'Satu item per baris; output akan diberi bullet otomatis.',
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
  executorRef: 'built-in.template.daily-report',
  primaryActionLabel: 'Generate report',
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

function formatMarkdown(input: DailyReportInput): string {
  return [
    `# Daily Report - ${input.date}`,
    '',
    `**Nama:** ${input.name.trim()}`,
    `**Tim:** ${input.team.trim()}`,
    '',
    '## Pekerjaan selesai',
    formatList(input.completed),
    '',
    '## Pekerjaan berjalan',
    formatList(input.inProgress),
    '',
    '## Kendala',
    formatList(input.blockers),
    '',
    '## Rencana berikutnya',
    formatList(input.nextPlan),
  ].join('\n')
}

function formatPlainText(input: DailyReportInput): string {
  return [
    'DAILY REPORT',
    '============',
    '',
    `Tanggal: ${input.date}`,
    `Nama: ${input.name.trim()}`,
    `Tim: ${input.team.trim()}`,
    '',
    'PEKERJAAN SELESAI',
    '------------------',
    formatList(input.completed),
    '',
    'PEKERJAAN BERJALAN',
    '-------------------',
    formatList(input.inProgress),
    '',
    'KENDALA',
    '-------',
    formatList(input.blockers),
    '',
    'RENCANA BERIKUTNYA',
    '-------------------',
    formatList(input.nextPlan),
  ].join('\n')
}

export function renderDailyReport(input: DailyReportInput, format: ReportFormat): string {
  return format === 'markdown' ? formatMarkdown(input) : formatPlainText(input)
}

function validateDailyReportInput(input: GeneratorInput): ValidationResult {
  const requiredTextFields: Array<{ id: keyof DailyReportInput; label: string }> = [
    { id: 'date', label: 'Tanggal' },
    { id: 'name', label: 'Nama' },
    { id: 'team', label: 'Tim' },
    { id: 'completed', label: 'Pekerjaan selesai' },
    { id: 'nextPlan', label: 'Rencana berikutnya' },
  ]

  for (const field of requiredTextFields) {
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
      issues: [createIssue('invalid-date', 'date', 'Tanggal harus menggunakan format kalender yang valid.')],
    }
  }

  for (const fieldId of ['inProgress', 'blockers'] as const) {
    if (input[fieldId] !== undefined && typeof input[fieldId] !== 'string') {
      return {
        valid: false,
        issues: [createIssue('invalid-text', fieldId, 'Nilai field harus berupa teks.')],
      }
    }
  }

  if (
    typeof input.format !== 'string' ||
    !REPORT_FORMATS.includes(input.format as ReportFormat)
  ) {
    return {
      valid: false,
      issues: [createIssue('invalid-format', 'format', 'Pilih format Markdown atau plain text.')],
    }
  }

  return { valid: true, issues: [] }
}

export const dailyReportGenerator: GeneratorModule = {
  definition,

  validate: validateDailyReportInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateDailyReportInput(input)
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

    const reportInput: DailyReportInput = {
      date: input.date as string,
      name: input.name as string,
      team: input.team as string,
      completed: input.completed as string,
      inProgress: input.inProgress as string | undefined,
      blockers: input.blockers as string | undefined,
      nextPlan: input.nextPlan as string,
    }
    const format = input.format as ReportFormat

    return {
      status: 'success',
      output: {
        type: format,
        mimeType: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
        content: renderDailyReport(reportInput, format),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
