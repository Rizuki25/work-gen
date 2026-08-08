import { describe, expect, it } from 'vitest'
import { businessEmailGenerator, renderBusinessEmail } from './business-email-generator'

const validInput = {
  purpose: 'jadwal review',
  recipients: 'Bima',
  subject: 'Review jadwal',
  context: 'Review dilakukan pada Jumat.',
  mainPoints: 'Dokumen sudah diperbarui\nBagian risiko perlu diperiksa',
  callToAction: 'Mohon konfirmasi sebelum Jumat.',
  tone: 'professional' as const,
}

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('businessEmailGenerator', () => {
  it('merender email Markdown dengan subject, recipient, dan body konsisten', () => {
    expect(renderBusinessEmail(validInput, 'markdown')).toBe(
      '**Subject:** Review jadwal\n' +
        '**To:** Bima\n' +
        '\n' +
        'Halo Bima,\n' +
        '\n' +
        'Saya menghubungi Anda terkait jadwal review.\n' +
        '\n' +
        'Review dilakukan pada Jumat.\n' +
        '\n' +
        'Poin utama:\n' +
        '- Dokumen sudah diperbarui\n' +
        '- Bagian risiko perlu diperiksa\n' +
        '\n' +
        'Tindak lanjut yang diharapkan:\n' +
        'Mohon konfirmasi sebelum Jumat.\n' +
        '\n' +
        'Terima kasih,',
    )
  })

  it('menggunakan fallback penerima dan CTA sesuai tone', () => {
    const output = renderBusinessEmail(
      { ...validInput, recipients: '', callToAction: '', tone: 'formal' },
      'plain-text',
    )

    expect(output).toContain('TO: Tim terkait')
    expect(output).toContain('Yth. Tim terkait,')
    expect(output).toContain('Mohon konfirmasi dan tindak lanjut sesuai kebutuhan.')
  })

  it('memvalidasi field wajib', () => {
    const result = businessEmailGenerator.validate({
      ...validInput,
      subject: '',
      format: 'markdown',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'subject' }],
    })
  })

  it('memvalidasi tone dan format output', () => {
    expect(
      businessEmailGenerator.validate({ ...validInput, tone: 'casual', format: 'markdown' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-tone', fieldId: 'tone' }],
    })
    expect(
      businessEmailGenerator.validate({ ...validInput, tone: 'formal', format: 'html' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-format', fieldId: 'format' }],
    })
  })

  it('menghasilkan Markdown atau plain text sesuai format execute', async () => {
    const markdownResult = await businessEmailGenerator.execute(
      { ...validInput, format: 'markdown' },
      executionContext,
    )
    const plainTextResult = await businessEmailGenerator.execute(
      { ...validInput, format: 'plain-text' },
      executionContext,
    )

    expect(markdownResult).toMatchObject({
      status: 'success',
      output: { type: 'markdown', mimeType: 'text/markdown;charset=utf-8' },
    })
    expect(plainTextResult).toMatchObject({
      status: 'success',
      output: { type: 'plain-text', mimeType: 'text/plain;charset=utf-8' },
    })
  })
})
