import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const TIMESTAMP_MODES = ['timestamp-to-date', 'date-to-timestamp'] as const
type TimestampMode = (typeof TIMESTAMP_MODES)[number]

const TIMESTAMP_UNITS = ['seconds', 'milliseconds'] as const
type TimestampUnit = (typeof TIMESTAMP_UNITS)[number]

const definition: GeneratorDefinition = {
  id: 'local.timestamp-converter',
  kind: 'local',
  name: 'Timestamp Converter',
  description: 'Mengubah timestamp dan tanggal dengan format timezone yang dapat dipilih.',
  category: 'Data & Conversion',
  tags: ['timestamp', 'date', 'time', 'timezone', 'epoch', 'offline'],
  icon: '◷',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'mode',
        type: 'enum',
        label: 'Mode',
        required: true,
        defaultValue: 'timestamp-to-date',
        options: [
          { value: 'timestamp-to-date', label: 'Timestamp → tanggal' },
          { value: 'date-to-timestamp', label: 'Tanggal → timestamp' },
        ],
      },
      {
        id: 'value',
        type: 'string',
        label: 'Nilai input',
        required: true,
        placeholder: 'Contoh: 0 atau 2026-08-08T00:00:00Z',
        helpText: 'Untuk tanggal, gunakan ISO 8601 agar hasil konsisten.',
      },
      {
        id: 'unit',
        type: 'enum',
        label: 'Unit timestamp',
        required: true,
        defaultValue: 'seconds',
        options: [
          { value: 'seconds', label: 'Seconds' },
          { value: 'milliseconds', label: 'Milliseconds' },
        ],
      },
      {
        id: 'timezone',
        type: 'string',
        label: 'Timezone tampilan',
        required: true,
        defaultValue: 'UTC',
        placeholder: 'Contoh: Asia/Jakarta atau UTC',
        helpText: 'Gunakan nama timezone IANA, misalnya Asia/Jakarta.',
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
  executorRef: 'built-in.local.timestamp-converter',
  primaryActionLabel: 'Convert time',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
    return true
  } catch {
    return false
  }
}

function parseTimestamp(value: string, unit: TimestampUnit): Date | undefined {
  const numericValue = Number(value.trim())
  if (!Number.isFinite(numericValue)) {
    return undefined
  }

  const milliseconds = unit === 'seconds' ? numericValue * 1000 : numericValue
  const date = new Date(milliseconds)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function parseDate(value: string): Date | undefined {
  const milliseconds = Date.parse(value.trim())
  if (Number.isNaN(milliseconds)) {
    return undefined
  }

  return new Date(milliseconds)
}

function validateTimestampInput(input: GeneratorInput): ValidationResult {
  const mode = input.mode
  if (typeof mode !== 'string' || !TIMESTAMP_MODES.includes(mode as TimestampMode)) {
    return {
      valid: false,
      issues: [createIssue('invalid-mode', 'mode', 'Pilih mode konversi yang tersedia.')],
    }
  }

  const value = input.value
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      valid: false,
      issues: [createIssue('required', 'value', 'Nilai input wajib diisi.')],
    }
  }

  const unit = input.unit
  if (typeof unit !== 'string' || !TIMESTAMP_UNITS.includes(unit as TimestampUnit)) {
    return {
      valid: false,
      issues: [createIssue('invalid-unit', 'unit', 'Pilih unit seconds atau milliseconds.')],
    }
  }

  const timezone = input.timezone
  if (typeof timezone !== 'string' || timezone.trim().length === 0) {
    return {
      valid: false,
      issues: [createIssue('required', 'timezone', 'Timezone wajib diisi.')],
    }
  }

  if (!isValidTimezone(timezone.trim())) {
    return {
      valid: false,
      issues: [createIssue('invalid-timezone', 'timezone', 'Timezone tidak dikenali. Gunakan nama IANA.')],
    }
  }

  const parsedDate =
    mode === 'timestamp-to-date'
      ? parseTimestamp(value, unit as TimestampUnit)
      : parseDate(value)

  if (!parsedDate) {
    return {
      valid: false,
      issues: [
        createIssue(
          'invalid-date-value',
          'value',
          mode === 'timestamp-to-date'
            ? 'Timestamp harus berupa angka yang valid.'
            : 'Tanggal harus berupa tanggal ISO 8601 yang valid.',
        ),
      ],
    }
  }

  return { valid: true, issues: [] }
}

function formatTimestampResult(
  date: Date,
  mode: TimestampMode,
  unit: TimestampUnit,
  timezone: string,
): string {
  const milliseconds = date.getTime()
  const seconds = milliseconds / 1000
  const selectedTimestamp = unit === 'seconds' ? seconds : milliseconds
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date)

  const lines = [
    `ISO 8601: ${date.toISOString()}`,
    `Waktu (${timezone}): ${formattedDate}`,
    `Timestamp (${unit}): ${selectedTimestamp}`,
    `Timestamp (seconds): ${seconds}`,
    `Timestamp (milliseconds): ${milliseconds}`,
  ]

  if (mode === 'date-to-timestamp') {
    lines.unshift('Mode: Tanggal → timestamp')
  } else {
    lines.unshift('Mode: Timestamp → tanggal')
  }

  return lines.join('\n')
}

export const timestampConverterGenerator: GeneratorModule = {
  definition,

  validate: validateTimestampInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateTimestampInput(input)
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

    const mode = input.mode as TimestampMode
    const value = input.value as string
    const unit = input.unit as TimestampUnit
    const timezone = (input.timezone as string).trim()
    const date = mode === 'timestamp-to-date' ? parseTimestamp(value, unit) : parseDate(value)

    if (!date) {
      return {
        status: 'failed',
        error: {
          code: 'invalid-date-value',
          fieldId: 'value',
          retryable: false,
          userMessage: 'Nilai tanggal atau timestamp tidak valid.',
        },
      }
    }

    return {
      status: 'success',
      output: {
        type: 'plain-text',
        mimeType: 'text/plain;charset=utf-8',
        content: formatTimestampResult(date, mode, unit, timezone),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
