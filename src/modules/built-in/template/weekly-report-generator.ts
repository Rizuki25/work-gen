import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const TEMPLATE_VERSION = 'weekly-report.v1'

export interface WeeklyReportInput {
  readonly period: string
  readonly summary: string
  readonly achievements: string
  readonly metrics?: string
  readonly blockers?: string
  readonly nextWeekPlan: string
}

const definition: GeneratorDefinition = {
  id: 'template.weekly-report',
  kind: 'template',
  name: 'Weekly Report',
  description: 'Membuat ringkasan mingguan konsisten dari form lokal tanpa AI.',
  category: 'Reports',
  tags: ['weekly', 'report', 'template', 'markdown', 'offline'],
  icon: 'WR',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'period',
        type: 'string',
        label: 'Periode',
        required: true,
        placeholder: '2026-08-03 - 2026-08-07',
        helpText: 'Tulis rentang tanggal yang ingin ditampilkan pada judul laporan.',
      },
      {
        id: 'summary',
        type: 'multiline-text',
        label: 'Ringkasan',
        required: true,
        placeholder: 'Ringkasan singkat fokus dan kondisi minggu ini...',
        helpText: 'Gunakan beberapa kalimat untuk konteks utama minggu ini.',
      },
      {
        id: 'achievements',
        type: 'multiline-text',
        label: 'Pencapaian',
        required: true,
        placeholder: 'Selesaikan milestone utama\nPerbaiki proses kerja',
        helpText: 'Satu pencapaian per baris; output akan diberi bullet otomatis.',
      },
      {
        id: 'metrics',
        type: 'multiline-text',
        label: 'Metrik',
        required: false,
        placeholder: 'Tiket selesai: 12\nSLA: 98%',
        helpText: 'Opsional; satu metrik per baris.',
      },
      {
        id: 'blockers',
        type: 'multiline-text',
        label: 'Kendala',
        required: false,
        placeholder: 'Kendala atau dependensi yang perlu ditindaklanjuti',
        helpText: 'Boleh dikosongkan; bagian ini akan menampilkan "Tidak ada".',
      },
      {
        id: 'nextWeekPlan',
        type: 'multiline-text',
        label: 'Rencana minggu berikutnya',
        required: true,
        placeholder: 'Lanjutkan milestone utama\nTutup action item tertunda',
        helpText: 'Satu rencana per baris; output akan diberi bullet otomatis.',
      },
    ],
  },
  outputTypes: ['markdown'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.template.weekly-report',
  primaryActionLabel: 'Generate report',
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

export function renderWeeklyReport(input: WeeklyReportInput): string {
  return [
    `# Weekly Report - ${input.period.trim()}`,
    '',
    '## Ringkasan',
    formatParagraph(input.summary),
    '',
    '## Pencapaian',
    formatList(input.achievements),
    '',
    '## Metrik',
    formatList(input.metrics),
    '',
    '## Kendala',
    formatList(input.blockers),
    '',
    '## Rencana minggu berikutnya',
    formatList(input.nextWeekPlan),
  ].join('\n')
}

function validateWeeklyReportInput(input: GeneratorInput): ValidationResult {
  const requiredFields: Array<{ id: keyof WeeklyReportInput; label: string }> = [
    { id: 'period', label: 'Periode' },
    { id: 'summary', label: 'Ringkasan' },
    { id: 'achievements', label: 'Pencapaian' },
    { id: 'nextWeekPlan', label: 'Rencana minggu berikutnya' },
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

  for (const fieldId of ['metrics', 'blockers'] as const) {
    if (input[fieldId] !== undefined && typeof input[fieldId] !== 'string') {
      return {
        valid: false,
        issues: [createIssue('invalid-text', fieldId, 'Nilai field harus berupa teks.')],
      }
    }
  }

  return { valid: true, issues: [] }
}

export const weeklyReportGenerator: GeneratorModule = {
  definition,

  validate: validateWeeklyReportInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateWeeklyReportInput(input)
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

    const reportInput: WeeklyReportInput = {
      period: input.period as string,
      summary: input.summary as string,
      achievements: input.achievements as string,
      metrics: input.metrics as string | undefined,
      blockers: input.blockers as string | undefined,
      nextWeekPlan: input.nextWeekPlan as string,
    }

    return {
      status: 'success',
      output: {
        type: 'markdown',
        mimeType: 'text/markdown;charset=utf-8',
        content: renderWeeklyReport(reportInput),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
