import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const CONVERSION_MODES = ['csv-to-json', 'json-to-csv'] as const
type ConversionMode = (typeof CONVERSION_MODES)[number]

const DELIMITER_OPTIONS = ['comma', 'semicolon', 'tab', 'pipe'] as const
type DelimiterOption = (typeof DELIMITER_OPTIONS)[number]

const DELIMITERS: Record<DelimiterOption, string> = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
}

const definition: GeneratorDefinition = {
  id: 'local.csv-json',
  kind: 'local',
  name: 'CSV <-> JSON Converter',
  description: 'Mengubah CSV dan JSON secara lokal dengan dukungan delimiter umum.',
  category: 'Data & Conversion',
  tags: ['csv', 'json', 'convert', 'delimiter', 'table', 'offline'],
  icon: 'CSV',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'mode',
        type: 'enum',
        label: 'Mode konversi',
        required: true,
        defaultValue: 'csv-to-json',
        options: [
          { value: 'csv-to-json', label: 'CSV -> JSON' },
          { value: 'json-to-csv', label: 'JSON -> CSV' },
        ],
      },
      {
        id: 'delimiter',
        type: 'enum',
        label: 'Delimiter CSV',
        required: true,
        defaultValue: 'comma',
        options: [
          { value: 'comma', label: 'Koma (,)' },
          { value: 'semicolon', label: 'Titik koma (;)' },
          { value: 'tab', label: 'Tab (\\t)' },
          { value: 'pipe', label: 'Pipe (|)' },
        ],
        helpText: 'Gunakan delimiter yang sama untuk membaca atau membuat CSV.',
      },
      {
        id: 'value',
        type: 'multiline-text',
        label: 'Input data',
        required: true,
        placeholder: 'name,role\nWorkGen,Local tool',
        helpText: 'CSV -> JSON menggunakan baris pertama sebagai nama property object.',
        hintByFieldValue: {
          fieldId: 'mode',
          values: {
            'csv-to-json': {
              placeholder: 'name,role\nWorkGen,Local tool',
              helpText: 'CSV -> JSON menggunakan baris pertama sebagai nama property object.',
            },
            'json-to-csv': {
              placeholder: '[{"name":"WorkGen","role":"Local tool"}]',
              helpText: 'JSON -> CSV membutuhkan array yang berisi object dengan property kolom.',
            },
          },
        },
      },
    ],
  },
  outputTypes: ['json', 'csv', 'plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.csv-json',
  primaryActionLabel: 'Convert format',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function getDelimiter(value: unknown): string {
  if (typeof value !== 'string' || !DELIMITER_OPTIONS.includes(value as DelimiterOption)) {
    throw new Error('Pilih delimiter CSV yang tersedia.')
  }

  return DELIMITERS[value as DelimiterOption]
}

function finishCsvRow(rows: string[][], row: string[], field: string): void {
  rows.push([...row, field])
}

export function parseCsv(source: string, delimiter = ','): string[][] {
  if (source.trim().length === 0) {
    throw new Error('CSV tidak boleh kosong.')
  }

  if (delimiter.length !== 1 || delimiter === '"' || delimiter === '\r' || delimiter === '\n') {
    throw new Error('Delimiter CSV tidak valid.')
  }

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let fieldStarted = false
  let inQuotes = false
  let afterClosingQuote = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const nextCharacter = source[index + 1]

    if (inQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
          afterClosingQuote = true
        }
      } else {
        field += character
      }
      continue
    }

    if (afterClosingQuote) {
      if (character === delimiter) {
        row.push(field)
        field = ''
        fieldStarted = false
        afterClosingQuote = false
        continue
      }

      if (character === '\r' || character === '\n') {
        finishCsvRow(rows, row, field)
        row = []
        field = ''
        fieldStarted = false
        afterClosingQuote = false
        if (character === '\r' && nextCharacter === '\n') {
          index += 1
        }
        continue
      }

      throw new Error('CSV memiliki karakter setelah tanda kutip penutup.')
    }

    if (character === '"') {
      if (fieldStarted || field.length > 0) {
        throw new Error('CSV memiliki tanda kutip di posisi yang tidak valid.')
      }

      inQuotes = true
      fieldStarted = true
      continue
    }

    if (character === delimiter) {
      row.push(field)
      field = ''
      fieldStarted = false
      continue
    }

    if (character === '\r' || character === '\n') {
      finishCsvRow(rows, row, field)
      row = []
      field = ''
      fieldStarted = false
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }
      continue
    }

    field += character
    fieldStarted = true
  }

  if (inQuotes) {
    throw new Error('CSV memiliki tanda kutip yang belum ditutup.')
  }

  if (afterClosingQuote || fieldStarted || field.length > 0 || row.length > 0) {
    finishCsvRow(rows, row, field)
  }

  return rows
}

function quoteCsvCell(value: string, delimiter: string): string {
  if (!/["\r\n]/u.test(value) && !value.includes(delimiter)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}

function stringifyJsonCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  const serialized = JSON.stringify(value)
  return serialized ?? ''
}

export function convertCsvToJson(source: string, delimiter = ','): string {
  const rows = parseCsv(source, delimiter)
  const headerRow = rows[0]

  if (!headerRow || headerRow.length === 0 || headerRow.some((header) => header.trim() === '')) {
    throw new Error('CSV harus memiliki nama kolom pada baris pertama.')
  }

  const headers = headerRow.map((header) => header.trim())
  if (new Set(headers).size !== headers.length) {
    throw new Error('CSV tidak boleh memiliki nama kolom yang duplikat.')
  }

  const records = rows.slice(1).map((row, rowIndex) => {
    if (row.length !== headers.length) {
      throw new Error(`Jumlah kolom pada baris ${rowIndex + 2} tidak sesuai header.`)
    }

    return Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  })

  return JSON.stringify(records, null, 2)
}

export function convertJsonToCsv(source: string, delimiter = ','): string {
  const parsed: unknown = JSON.parse(source)

  if (!Array.isArray(parsed)) {
    throw new Error('JSON harus berupa array berisi object.')
  }

  if (parsed.length === 0) {
    throw new Error('JSON array harus memiliki setidaknya satu object.')
  }

  const records = parsed.map((record, index) => {
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`Item JSON pada index ${index} harus berupa object.`)
    }

    return record as Record<string, unknown>
  })

  const headers: string[] = []
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!headers.includes(key)) {
        headers.push(key)
      }
    }
  }

  if (headers.length === 0) {
    throw new Error('Object JSON harus memiliki setidaknya satu property.')
  }

  const lines = [
    headers.map((header) => quoteCsvCell(header, delimiter)).join(delimiter),
    ...records.map((record) =>
      headers
        .map((header) => quoteCsvCell(stringifyJsonCell(record[header]), delimiter))
        .join(delimiter),
    ),
  ]

  return lines.join('\r\n')
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function validateCsvJsonInput(input: GeneratorInput): ValidationResult {
  const mode = input.mode
  if (typeof mode !== 'string' || !CONVERSION_MODES.includes(mode as ConversionMode)) {
    return {
      valid: false,
      issues: [createIssue('invalid-mode', 'mode', 'Pilih mode konversi CSV atau JSON.')],
    }
  }

  if (typeof input.delimiter !== 'string' || !DELIMITER_OPTIONS.includes(input.delimiter as DelimiterOption)) {
    return {
      valid: false,
      issues: [createIssue('invalid-delimiter', 'delimiter', 'Pilih delimiter CSV yang tersedia.')],
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
    const delimiter = getDelimiter(input.delimiter)
    if (mode === 'csv-to-json') {
      convertCsvToJson(value, delimiter)
    } else {
      convertJsonToCsv(value, delimiter)
    }
  } catch (error) {
    return {
      valid: false,
      issues: [
        createIssue(
          mode === 'csv-to-json' ? 'invalid-csv' : 'invalid-json',
          'value',
          errorMessage(
            error,
            mode === 'csv-to-json'
              ? 'CSV tidak valid. Periksa header, delimiter, quote, dan jumlah kolom.'
              : 'JSON tidak valid. Pastikan input berupa array berisi object.',
          ),
        ),
      ],
    }
  }

  return { valid: true, issues: [] }
}

export const csvJsonGenerator: GeneratorModule = {
  definition,

  validate: validateCsvJsonInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateCsvJsonInput(input)
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
    const delimiter = getDelimiter(input.delimiter)

    try {
      if (mode === 'csv-to-json') {
        return {
          status: 'success',
          output: {
            type: 'json',
            mimeType: 'application/json;charset=utf-8',
            content: convertCsvToJson(value, delimiter),
          },
        }
      }

      return {
        status: 'success',
        output: {
          type: 'csv',
          mimeType: 'text/csv;charset=utf-8',
          content: convertJsonToCsv(value, delimiter),
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
