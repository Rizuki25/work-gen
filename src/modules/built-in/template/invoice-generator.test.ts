import { describe, expect, it } from 'vitest'
import {
  calculateInvoiceTotals,
  renderInvoice,
  invoiceGenerator,
  type InvoiceInput,
} from './invoice-generator'

const validInput: InvoiceInput = {
  invoiceNumber: 'INV-001',
  date: '2026-08-08',
  seller: 'PT WorkGen\nJakarta',
  buyer: 'CV Example\nBandung',
  items: 'Implementasi | 2 | 150000\nSupport | 1 | 50000',
  discountType: 'percentage',
  discountValue: 10,
  taxRate: 11,
  currency: 'IDR',
  notes: 'Pembayaran maksimal 7 hari.',
}

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('invoiceGenerator', () => {
  it('menghitung subtotal, diskon, pajak, dan total secara lokal', () => {
    expect(calculateInvoiceTotals([
      { description: 'Implementasi', quantity: 2, unitPrice: 150000 },
      { description: 'Support', quantity: 1, unitPrice: 50000 },
    ], 11, 'percentage', 10)).toEqual({
      subtotal: 350000,
      discount: 35000,
      taxableSubtotal: 315000,
      tax: 34650,
      total: 349650,
    })
  })

  it('merender output Markdown konsisten sebagai invoice', () => {
    expect(renderInvoice(validInput, 'markdown')).toBe(
      '# Invoice\n' +
        '\n' +
        '**Nomor:** INV-001\n' +
        '**Tanggal:** 2026-08-08\n' +
        '**Mata uang:** IDR\n' +
        '\n' +
        '## Penjual\n' +
        'PT WorkGen  \n' +
        'Jakarta\n' +
        '\n' +
        '## Pembeli\n' +
        'CV Example  \n' +
        'Bandung\n' +
        '\n' +
        '## Rincian item\n' +
        '| Item | Qty | Harga satuan | Jumlah |\n' +
        '| --- | ---: | ---: | ---: |\n' +
        '| Implementasi | 2 | IDR 150.000 | IDR 300.000 |\n' +
        '| Support | 1 | IDR 50.000 | IDR 50.000 |\n' +
        '\n' +
        '**Subtotal:** IDR 350.000\n' +
        '**Diskon (10%):** -IDR 35.000\n' +
        '**Pajak (11%):** IDR 34.650\n' +
        '**Total:** IDR 349.650\n' +
        '\n' +
        '## Catatan\n' +
        'Pembayaran maksimal 7 hari.',
    )
  })

  it('merender HTML dengan escaping untuk konten pengguna', () => {
    const output = renderInvoice({
      ...validInput,
      seller: 'Acme <Ltd>',
      items: 'Consult <X> | 1 | 1000',
    }, 'html')

    expect(output).toContain('<!doctype html>')
    expect(output).toContain('Acme &lt;Ltd&gt;')
    expect(output).toContain('Consult &lt;X&gt;')
    expect(output).toContain('IDR 1.000')
  })

  it('menggunakan fallback untuk nomor dan catatan yang kosong', () => {
    const output = renderInvoice({
      ...validInput,
      invoiceNumber: undefined,
      notes: undefined,
      discountValue: 0,
      taxRate: 0,
    }, 'markdown')

    expect(output).toContain('**Nomor:** Tidak ada')
    expect(output).toContain('**Diskon (0%):** -IDR 0')
    expect(output).toContain('**Pajak (0%):** IDR 0')
    expect(output).toContain('## Catatan\nTidak ada')
  })

  it('memvalidasi format item dan batas diskon', () => {
    expect(invoiceGenerator.validate({
      ...validInput,
      items: 'Item tanpa separator',
    })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-item-format', fieldId: 'items' }],
    })

    expect(invoiceGenerator.validate({
      ...validInput,
      discountType: 'fixed',
      discountValue: 400000,
    })).toMatchObject({
      valid: false,
      issues: [{ code: 'discount-too-high', fieldId: 'discountValue' }],
    })
  })

  it('menolak angka pajak di luar rentang', () => {
    expect(invoiceGenerator.validate({
      ...validInput,
      taxRate: 101,
    })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-tax-rate', fieldId: 'taxRate' }],
    })
  })

  it('menghasilkan output HTML saat execute', async () => {
    const result = await invoiceGenerator.execute({
      ...validInput,
      format: 'html',
    }, executionContext)

    expect(result).toMatchObject({
      status: 'success',
      output: { type: 'html', mimeType: 'text/html;charset=utf-8' },
    })
  })
})
