import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const TEMPLATE_VERSION = 'sop.v1'

export interface SopInput {
  readonly title: string
  readonly purpose: string
  readonly scope: string
  readonly prerequisites?: string
  readonly steps: string
  readonly checks?: string
  readonly escalation?: string
}

const definition: GeneratorDefinition = {
  id: 'template.sop',
  kind: 'template',
  name: 'SOP sederhana',
  description: 'Membuat prosedur operasional sederhana dari form lokal tanpa AI.',
  category: 'Documents',
  tags: ['sop', 'procedure', 'operations', 'template', 'markdown', 'offline'],
  icon: 'SOP',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'title',
        type: 'string',
        label: 'Judul SOP',
        required: true,
        placeholder: 'Proses review dan publikasi dokumen',
      },
      {
        id: 'purpose',
        type: 'multiline-text',
        label: 'Tujuan',
        required: true,
        placeholder: 'Jelaskan tujuan prosedur ini...',
      },
      {
        id: 'scope',
        type: 'multiline-text',
        label: 'Ruang lingkup',
        required: true,
        placeholder: 'Jelaskan proses, tim, atau kondisi yang dicakup...',
      },
      {
        id: 'prerequisites',
        type: 'multiline-text',
        label: 'Prasyarat (opsional)',
        required: false,
        placeholder: 'Akses aplikasi\nDokumen sumber terbaru',
        helpText: 'Satu prasyarat per baris; bagian kosong akan menjadi "Tidak ada".',
      },
      {
        id: 'steps',
        type: 'multiline-text',
        label: 'Langkah-langkah',
        required: true,
        placeholder: 'Buka dokumen kerja\nPeriksa isi\nSimpan hasil review',
        helpText: 'Satu langkah per baris; output akan diberi nomor otomatis.',
      },
      {
        id: 'checks',
        type: 'multiline-text',
        label: 'Pemeriksaan (opsional)',
        required: false,
        placeholder: 'Pastikan semua field wajib terisi\nPastikan file dapat dibuka',
        helpText: 'Satu pemeriksaan per baris.',
      },
      {
        id: 'escalation',
        type: 'multiline-text',
        label: 'Eskalasi (opsional)',
        required: false,
        placeholder: 'Hubungi owner proses jika validasi gagal',
        helpText: 'Tulis kondisi eskalasi atau pihak yang perlu dihubungi.',
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
  executorRef: 'built-in.template.sop',
  primaryActionLabel: 'Generate SOP',
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

function formatParagraph(value: string): string {
  const lines = cleanLines(value)
  return lines.length > 0 ? lines.join('\n') : 'Tidak ada'
}

function formatBullets(value: string | undefined): string {
  const lines = cleanLines(value)
  if (lines.length === 0) {
    return 'Tidak ada'
  }

  return lines
    .map((line) => /^[-*+]\s+/u.test(line) ? line : `- ${line}`)
    .join('\n')
}

function formatNumberedSteps(value: string): string {
  return cleanLines(value)
    .map((line, index) => {
      const normalized = line.replace(/^(?:\d+[.)]\s+|[-*+]\s+)/u, '')
      return `${index + 1}. ${normalized}`
    })
    .join('\n')
}

export function renderSop(input: SopInput): string {
  return [
    `# SOP - ${input.title.trim()}`,
    '',
    '## Tujuan',
    formatParagraph(input.purpose),
    '',
    '## Ruang lingkup',
    formatParagraph(input.scope),
    '',
    '## Prasyarat',
    formatBullets(input.prerequisites),
    '',
    '## Langkah-langkah',
    formatNumberedSteps(input.steps),
    '',
    '## Pemeriksaan',
    formatBullets(input.checks),
    '',
    '## Eskalasi',
    formatParagraph(input.escalation ?? ''),
  ].join('\n')
}

function validateSopInput(input: GeneratorInput): ValidationResult {
  const requiredFields: Array<{ id: keyof SopInput; label: string }> = [
    { id: 'title', label: 'Judul SOP' },
    { id: 'purpose', label: 'Tujuan' },
    { id: 'scope', label: 'Ruang lingkup' },
    { id: 'steps', label: 'Langkah-langkah' },
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

  for (const fieldId of ['prerequisites', 'checks', 'escalation'] as const) {
    if (input[fieldId] !== undefined && typeof input[fieldId] !== 'string') {
      return {
        valid: false,
        issues: [createIssue('invalid-text', fieldId, 'Nilai field harus berupa teks.')],
      }
    }
  }

  return { valid: true, issues: [] }
}

export const sopGenerator: GeneratorModule = {
  definition,

  validate: validateSopInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateSopInput(input)
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

    const sopInput: SopInput = {
      title: input.title as string,
      purpose: input.purpose as string,
      scope: input.scope as string,
      prerequisites: input.prerequisites as string | undefined,
      steps: input.steps as string,
      checks: input.checks as string | undefined,
      escalation: input.escalation as string | undefined,
    }

    return {
      status: 'success',
      output: {
        type: 'markdown',
        mimeType: 'text/markdown;charset=utf-8',
        content: renderSop(sopInput),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
