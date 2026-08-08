import { describe, expect, it } from 'vitest'
import { dailyReportGenerator, renderDailyReport } from './daily-report-generator'

const validInput = {
  date: '2026-08-08',
  name: 'Fahzri',
  team: 'WorkGen',
  completed: 'Implement registry\nAdd tests',
  inProgress: 'Review UI',
  blockers: '',
  nextPlan: 'Add template generator',
}

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('dailyReportGenerator', () => {
  it('merender output Markdown konsisten sebagai golden output', () => {
    expect(renderDailyReport(validInput, 'markdown')).toBe(
      '# Daily Report - 2026-08-08\n' +
        '\n' +
        '**Nama:** Fahzri\n' +
        '**Tim:** WorkGen\n' +
        '\n' +
        '## Pekerjaan selesai\n' +
        '- Implement registry\n' +
        '- Add tests\n' +
        '\n' +
        '## Pekerjaan berjalan\n' +
        '- Review UI\n' +
        '\n' +
        '## Kendala\n' +
        'Tidak ada\n' +
        '\n' +
        '## Rencana berikutnya\n' +
        '- Add template generator',
    )
  })

  it('menggunakan fallback konsisten untuk field opsional kosong', () => {
    const output = renderDailyReport({ ...validInput, inProgress: '', blockers: '' }, 'plain-text')

    expect(output).toContain('PEKERJAAN BERJALAN\n-------------------\nTidak ada')
    expect(output).toContain('KENDALA\n-------\nTidak ada')
  })

  it('memvalidasi field wajib', () => {
    const result = dailyReportGenerator.validate({
      ...validInput,
      name: '',
      format: 'markdown',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'name' }],
    })
  })

  it('memvalidasi tanggal dan format output', () => {
    expect(
      dailyReportGenerator.validate({ ...validInput, date: '2026-02-30', format: 'markdown' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-date', fieldId: 'date' }],
    })
    expect(
      dailyReportGenerator.validate({ ...validInput, format: 'html' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-format', fieldId: 'format' }],
    })
  })

  it('menghasilkan output Markdown atau plain text sesuai mode execute', async () => {
    const markdownResult = await dailyReportGenerator.execute(
      { ...validInput, format: 'markdown' },
      executionContext,
    )
    const plainTextResult = await dailyReportGenerator.execute(
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
