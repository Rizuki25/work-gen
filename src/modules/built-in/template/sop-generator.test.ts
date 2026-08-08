import { describe, expect, it } from 'vitest'
import { renderSop, sopGenerator } from './sop-generator'

const validInput = {
  title: 'Review dokumen',
  purpose: 'Memastikan dokumen siap dipublikasikan.',
  scope: 'Dokumen kerja tim sebelum rilis.',
  prerequisites: 'Akses aplikasi\nDokumen terbaru',
  steps: 'Buka dokumen\nPeriksa isi\nSimpan hasil review',
  checks: 'Semua field wajib terisi\nFile dapat dibuka',
  escalation: 'Hubungi owner proses jika validasi gagal.',
}

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('sopGenerator', () => {
  it('merender SOP Markdown dengan langkah bernomor', () => {
    expect(renderSop(validInput)).toBe(
      '# SOP - Review dokumen\n' +
        '\n' +
        '## Tujuan\n' +
        'Memastikan dokumen siap dipublikasikan.\n' +
        '\n' +
        '## Ruang lingkup\n' +
        'Dokumen kerja tim sebelum rilis.\n' +
        '\n' +
        '## Prasyarat\n' +
        '- Akses aplikasi\n' +
        '- Dokumen terbaru\n' +
        '\n' +
        '## Langkah-langkah\n' +
        '1. Buka dokumen\n' +
        '2. Periksa isi\n' +
        '3. Simpan hasil review\n' +
        '\n' +
        '## Pemeriksaan\n' +
        '- Semua field wajib terisi\n' +
        '- File dapat dibuka\n' +
        '\n' +
        '## Eskalasi\n' +
        'Hubungi owner proses jika validasi gagal.',
    )
  })

  it('menggunakan fallback untuk bagian opsional kosong', () => {
    const output = renderSop({ ...validInput, prerequisites: '', checks: '', escalation: '' })

    expect(output).toContain('## Prasyarat\nTidak ada')
    expect(output).toContain('## Pemeriksaan\nTidak ada')
    expect(output).toContain('## Eskalasi\nTidak ada')
  })

  it('memvalidasi field wajib', () => {
    const result = sopGenerator.validate({ ...validInput, steps: '' })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'steps' }],
    })
  })

  it('memvalidasi tipe field opsional', () => {
    const result = sopGenerator.validate({ ...validInput, checks: 4 })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-text', fieldId: 'checks' }],
    })
  })

  it('menghasilkan Markdown saat execute', async () => {
    const result = await sopGenerator.execute(validInput, executionContext)

    expect(result).toMatchObject({
      status: 'success',
      output: { type: 'markdown', mimeType: 'text/markdown;charset=utf-8' },
    })
  })
})
