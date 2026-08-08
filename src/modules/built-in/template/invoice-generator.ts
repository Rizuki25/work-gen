import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const OUTPUT_FORMATS = ['markdown', 'html'] as const
type OutputFormat = (typeof OUTPUT_FORMATS)[number]

const DISCOUNT_TYPES = ['percentage', 'fixed'] as const
type DiscountType = (typeof DISCOUNT_TYPES)[number]

const CURRENCIES = ['IDR', 'USD', 'EUR'] as const
type Currency = (typeof CURRENCIES)[number]

const TEMPLATE_VERSION = 'invoice.v1'

export interface InvoiceItem {
  readonly description: string
  readonly quantity: number
  readonly unitPrice: number
}

export interface InvoiceInput {
  readonly invoiceNumber?: string
  readonly date: string
  readonly seller: string
  readonly buyer: string
  readonly items: string
  readonly taxRate?: number
  readonly discountType: DiscountType
  readonly discountValue?: number
  readonly currency: Currency
  readonly notes?: string
}

export interface InvoiceTotals {
  readonly subtotal: number
  readonly discount: number
  readonly taxableSubtotal: number
  readonly tax: number
  readonly total: number
}

const definition: GeneratorDefinition = {
  id: 'template.invoice',
  kind: 'template',
  name: 'Invoice sederhana',
  description: 'Membuat invoice sederhana dengan kalkulasi lokal tanpa AI.',
  category: 'Documents',
  tags: ['invoice', 'faktur', 'billing', 'template', 'markdown', 'html', 'offline'],
  icon: 'INV',
  version: TEMPLATE_VERSION,
  inputSchema: {
    fields: [
      {
        id: 'invoiceNumber',
        type: 'string',
        label: 'Nomor invoice (opsional)',
        required: false,
        placeholder: 'INV-2026-001',
      },
      {
        id: 'date',
        type: 'date',
        label: 'Tanggal invoice',
        required: true,
        defaultValue: new Date().toISOString().slice(0, 10),
      },
      {
        id: 'seller',
        type: 'multiline-text',
        label: 'Identitas penjual',
        required: true,
        placeholder: 'PT WorkGen\nJl. Contoh No. 1\nJakarta',
        helpText: 'Satu baris untuk setiap bagian identitas atau alamat.',
      },
      {
        id: 'buyer',
        type: 'multiline-text',
        label: 'Identitas pembeli',
        required: true,
        placeholder: 'CV Example\nJl. Pembeli No. 2\nBandung',
        helpText: 'Satu baris untuk setiap bagian identitas atau alamat.',
      },
      {
        id: 'items',
        type: 'multiline-text',
        label: 'Item invoice',
        required: true,
        placeholder: 'Desain logo | 2 | 150000\nKonsultasi | 1 | 500000',
        helpText: 'Satu item per baris dengan format: nama item | qty | harga satuan.',
      },
      {
        id: 'discountType',
        type: 'enum',
        label: 'Jenis diskon',
        required: true,
        defaultValue: 'percentage',
        options: [
          { value: 'percentage', label: 'Persentase (%)' },
          { value: 'fixed', label: 'Nominal tetap' },
        ],
        helpText: 'Pilih persentase atau nominal tetap untuk nilai diskon.',
      },
      {
        id: 'discountValue',
        type: 'number',
        label: 'Nilai diskon (opsional)',
        required: false,
        defaultValue: 0,
        min: 0,
        placeholder: '10',
        helpText: 'Gunakan angka positif. Untuk persentase, maksimum 100.',
      },
      {
        id: 'taxRate',
        type: 'number',
        label: 'Pajak (%) (opsional)',
        required: false,
        defaultValue: 0,
        min: 0,
        max: 100,
        placeholder: '11',
        helpText: 'Pajak dihitung dari subtotal setelah diskon.',
      },
      {
        id: 'currency',
        type: 'enum',
        label: 'Mata uang',
        required: true,
        defaultValue: 'IDR',
        options: [
          { value: 'IDR', label: 'IDR - Rupiah' },
          { value: 'USD', label: 'USD - US Dollar' },
          { value: 'EUR', label: 'EUR - Euro' },
        ],
      },
      {
        id: 'notes',
        type: 'multiline-text',
        label: 'Catatan (opsional)',
        required: false,
        placeholder: 'Pembayaran maksimal 7 hari setelah invoice diterima.',
      },
      {
        id: 'format',
        type: 'enum',
        label: 'Format output',
        required: true,
        defaultValue: 'markdown',
        options: [
          { value: 'markdown', label: 'Markdown' },
          { value: 'html', label: 'HTML' },
        ],
        helpText: 'Invoice dirender lokal; PDF dapat ditambahkan pada fase berikutnya.',
      },
    ],
  },
  outputTypes: ['markdown', 'html'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.template.invoice',
  primaryActionLabel: 'Generate invoice',
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

function parseItems(value: string): { readonly items: InvoiceItem[]; readonly issue?: ValidationIssue } {
  const lines = cleanLines(value)
  if (lines.length === 0) {
    return {
      items: [],
      issue: createIssue('required', 'items', 'Minimal satu item invoice wajib diisi.'),
    }
  }

  const items: InvoiceItem[] = []

  for (const [index, line] of lines.entries()) {
    const parts = line.split('|').map((part) => part.trim())
    if (parts.length !== 3 || parts[0]!.length === 0) {
      return {
        items: [],
        issue: createIssue(
          'invalid-item-format',
          'items',
          `Format item baris ${index + 1} harus: nama item | qty | harga satuan.`,
        ),
      }
    }

    const quantity = Number(parts[1])
    const unitPrice = Number(parts[2])
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return {
        items: [],
        issue: createIssue('invalid-quantity', 'items', `Qty pada item baris ${index + 1} harus lebih besar dari 0.`),
      }
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        items: [],
        issue: createIssue('invalid-unit-price', 'items', `Harga pada item baris ${index + 1} harus 0 atau lebih.`),
      }
    }

    items.push({
      description: parts[0]!,
      quantity,
      unitPrice,
    })
  }

  return { items }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateInvoiceTotals(
  items: readonly InvoiceItem[],
  taxRate: number,
  discountType: DiscountType,
  discountValue: number,
): InvoiceTotals {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  )
  const rawDiscount = discountType === 'percentage'
    ? subtotal * (discountValue / 100)
    : discountValue
  const discount = roundMoney(Math.min(Math.max(rawDiscount, 0), subtotal))
  const taxableSubtotal = roundMoney(subtotal - discount)
  const tax = roundMoney(taxableSubtotal * (taxRate / 100))

  return {
    subtotal,
    discount,
    taxableSubtotal,
    tax,
    total: roundMoney(taxableSubtotal + tax),
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatAmount(value: number, currency: Currency): string {
  const fractionDigits = currency === 'IDR' ? 0 : 2
  return `${currency} ${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}`
}

function displayValue(value: string | undefined): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Tidak ada'
}

function formatIdentity(value: string): string {
  return cleanLines(value).join('  \n')
}

function formatNotes(value: string | undefined): string {
  const lines = cleanLines(value)
  return lines.length > 0 ? lines.join('\n') : 'Tidak ada'
}

function formatDiscountLabel(input: InvoiceInput): string {
  const value = input.discountValue ?? 0
  return input.discountType === 'percentage' ? `${formatNumber(value)}%` : 'nominal'
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatHtmlLines(value: string): string {
  return cleanLines(value).map((line) => escapeHtml(line)).join('<br />\n')
}

function formatMarkdown(input: InvoiceInput, items: readonly InvoiceItem[], totals: InvoiceTotals): string {
  return [
    '# Invoice',
    '',
    `**Nomor:** ${displayValue(input.invoiceNumber)}`,
    `**Tanggal:** ${input.date}`,
    `**Mata uang:** ${input.currency}`,
    '',
    '## Penjual',
    formatIdentity(input.seller),
    '',
    '## Pembeli',
    formatIdentity(input.buyer),
    '',
    '## Rincian item',
    '| Item | Qty | Harga satuan | Jumlah |',
    '| --- | ---: | ---: | ---: |',
    ...items.map((item) =>
      `| ${item.description.replaceAll('|', '\\|')} | ${formatNumber(item.quantity)} | ${formatAmount(item.unitPrice, input.currency)} | ${formatAmount(item.quantity * item.unitPrice, input.currency)} |`,
    ),
    '',
    `**Subtotal:** ${formatAmount(totals.subtotal, input.currency)}`,
    `**Diskon (${formatDiscountLabel(input)}):** -${formatAmount(totals.discount, input.currency)}`,
    `**Pajak (${formatNumber(input.taxRate ?? 0)}%):** ${formatAmount(totals.tax, input.currency)}`,
    `**Total:** ${formatAmount(totals.total, input.currency)}`,
    '',
    '## Catatan',
    formatNotes(input.notes),
  ].join('\n')
}

function formatHtml(input: InvoiceInput, items: readonly InvoiceItem[], totals: InvoiceTotals): string {
  const itemRows = items
    .map((item) => [
      '<tr>',
      `<td>${escapeHtml(item.description)}</td>`,
      `<td class="number">${formatNumber(item.quantity)}</td>`,
      `<td class="number">${formatAmount(item.unitPrice, input.currency)}</td>`,
      `<td class="number">${formatAmount(item.quantity * item.unitPrice, input.currency)}</td>`,
      '</tr>',
    ].join(''))
    .join('\n')

  const notes = cleanLines(input.notes).length > 0
    ? formatHtmlLines(input.notes!)
    : 'Tidak ada'

  return [
    '<!doctype html>',
    '<html lang="id">',
    '<head>',
    '  <meta charset="utf-8" />',
    `  <title>Invoice ${escapeHtml(displayValue(input.invoiceNumber))}</title>`,
    '  <style>',
    '    body { font-family: Arial, sans-serif; color: #1f2933; margin: 0; padding: 32px; }',
    '    .invoice { max-width: 820px; margin: 0 auto; }',
    '    h1 { margin-bottom: 8px; }',
    '    .meta, .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }',
    '    .card { border: 1px solid #d9e2ec; border-radius: 8px; padding: 16px; }',
    '    dt { color: #52606d; font-size: 12px; text-transform: uppercase; }',
    '    dd { margin: 4px 0 0; white-space: pre-line; }',
    '    table { width: 100%; border-collapse: collapse; margin-top: 24px; }',
    '    th, td { border-bottom: 1px solid #d9e2ec; padding: 10px 8px; text-align: left; }',
    '    th { background: #f0f4f8; }',
    '    .number { text-align: right; white-space: nowrap; }',
    '    .totals { margin: 20px 0 0 auto; max-width: 320px; }',
    '    .total { border-top: 2px solid #1f2933; font-size: 18px; font-weight: 700; }',
    '    .notes { margin-top: 24px; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <main class="invoice">',
    '    <h1>Invoice</h1>',
    '    <section class="meta">',
    '      <div class="card"><dt>Nomor</dt><dd>' + escapeHtml(displayValue(input.invoiceNumber)) + '</dd></div>',
    '      <div class="card"><dt>Tanggal</dt><dd>' + escapeHtml(input.date) + '</dd></div>',
    '    </section>',
    '    <section class="parties">',
    '      <div class="card"><dt>Penjual</dt><dd>' + formatHtmlLines(input.seller) + '</dd></div>',
    '      <div class="card"><dt>Pembeli</dt><dd>' + formatHtmlLines(input.buyer) + '</dd></div>',
    '    </section>',
    '    <table>',
    '      <thead><tr><th>Item</th><th class="number">Qty</th><th class="number">Harga satuan</th><th class="number">Jumlah</th></tr></thead>',
    `      <tbody>${itemRows}</tbody>`,
    '    </table>',
    '    <section class="totals">',
    `      <div>Subtotal: <strong>${formatAmount(totals.subtotal, input.currency)}</strong></div>`,
    `      <div>Diskon (${escapeHtml(formatDiscountLabel(input))}): <strong>-${formatAmount(totals.discount, input.currency)}</strong></div>`,
    `      <div>Pajak (${formatNumber(input.taxRate ?? 0)}%): <strong>${formatAmount(totals.tax, input.currency)}</strong></div>`,
    `      <div class="total">Total: ${formatAmount(totals.total, input.currency)}</div>`,
    '    </section>',
    '    <section class="notes">',
    '      <h2>Catatan</h2>',
    `      <p>${notes}</p>`,
    '    </section>',
    '  </main>',
    '</body>',
    '</html>',
  ].join('\n')
}

export function renderInvoice(input: InvoiceInput, format: OutputFormat): string {
  const parsed = parseItems(input.items)
  const items = parsed.items
  const totals = calculateInvoiceTotals(
    items,
    input.taxRate ?? 0,
    input.discountType,
    input.discountValue ?? 0,
  )

  return format === 'markdown'
    ? formatMarkdown(input, items, totals)
    : formatHtml(input, items, totals)
}

function validateInvoiceInput(input: GeneratorInput): ValidationResult {
  const requiredTextFields: Array<{ id: string; label: string }> = [
    { id: 'date', label: 'Tanggal invoice' },
    { id: 'seller', label: 'Identitas penjual' },
    { id: 'buyer', label: 'Identitas pembeli' },
    { id: 'items', label: 'Item invoice' },
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
      issues: [createIssue('invalid-date', 'date', 'Tanggal invoice tidak valid.')],
    }
  }

  const parsed = parseItems(input.items as string)
  if (parsed.issue) {
    return { valid: false, issues: [parsed.issue] }
  }

  const taxRate = input.taxRate === undefined ? 0 : input.taxRate
  if (typeof taxRate !== 'number' || !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    return {
      valid: false,
      issues: [createIssue('invalid-tax-rate', 'taxRate', 'Pajak harus berupa angka antara 0 sampai 100.')],
    }
  }

  const discountType = input.discountType
  if (typeof discountType !== 'string' || !DISCOUNT_TYPES.includes(discountType as DiscountType)) {
    return {
      valid: false,
      issues: [createIssue('invalid-discount-type', 'discountType', 'Pilih jenis diskon yang tersedia.')],
    }
  }

  const discountValue = input.discountValue === undefined ? 0 : input.discountValue
  if (typeof discountValue !== 'number' || !Number.isFinite(discountValue) || discountValue < 0) {
    return {
      valid: false,
      issues: [createIssue('invalid-discount-value', 'discountValue', 'Nilai diskon harus berupa angka 0 atau lebih.')],
    }
  }

  if (discountType === 'percentage' && discountValue > 100) {
    return {
      valid: false,
      issues: [createIssue('invalid-discount-value', 'discountValue', 'Diskon persentase maksimum 100.')],
    }
  }

  const totals = calculateInvoiceTotals(parsed.items, taxRate, discountType as DiscountType, discountValue)
  if (discountType === 'fixed' && discountValue > totals.subtotal) {
    return {
      valid: false,
      issues: [createIssue('discount-too-high', 'discountValue', 'Diskon nominal tidak boleh melebihi subtotal.')],
    }
  }

  if (input.invoiceNumber !== undefined && typeof input.invoiceNumber !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-text', 'invoiceNumber', 'Nomor invoice harus berupa teks.')],
    }
  }

  if (input.notes !== undefined && typeof input.notes !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-text', 'notes', 'Catatan harus berupa teks.')],
    }
  }

  if (typeof input.currency !== 'string' || !CURRENCIES.includes(input.currency as Currency)) {
    return {
      valid: false,
      issues: [createIssue('invalid-currency', 'currency', 'Pilih mata uang yang tersedia.')],
    }
  }

  if (typeof input.format !== 'string' || !OUTPUT_FORMATS.includes(input.format as OutputFormat)) {
    return {
      valid: false,
      issues: [createIssue('invalid-format', 'format', 'Pilih format Markdown atau HTML.')],
    }
  }

  return { valid: true, issues: [] }
}

export const invoiceGenerator: GeneratorModule = {
  definition,

  validate: validateInvoiceInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateInvoiceInput(input)
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

    const invoiceInput: InvoiceInput = {
      invoiceNumber: input.invoiceNumber as string | undefined,
      date: input.date as string,
      seller: input.seller as string,
      buyer: input.buyer as string,
      items: input.items as string,
      taxRate: input.taxRate as number | undefined,
      discountType: input.discountType as DiscountType,
      discountValue: input.discountValue as number | undefined,
      currency: input.currency as Currency,
      notes: input.notes as string | undefined,
    }
    const format = input.format as OutputFormat

    return {
      status: 'success',
      output: {
        type: format,
        mimeType: format === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/html;charset=utf-8',
        content: renderInvoice(invoiceInput, format),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
