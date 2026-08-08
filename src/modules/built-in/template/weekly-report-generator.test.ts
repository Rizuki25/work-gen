import { describe, expect, it } from 'vitest'
import { renderWeeklyReport, weeklyReportGenerator } from './weekly-report-generator'

const validInput = {
  period: '2026-08-03 - 2026-08-07',
  summary: 'Fokus minggu ini adalah menyelesaikan fondasi template.',
  achievements: 'Daily Report selesai\nOutput dapat diedit',
  metrics: 'Template aktif: 1\nTest lulus: 91',
  blockers: '',
  nextWeekPlan: 'Mulai Meeting Minutes\nReview template output',
}

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('weeklyReportGenerator', () => {
  it('merender output Markdown konsisten sebagai golden output', () => {
    expect(renderWeeklyReport(validInput)).toBe(
      '# Weekly Report - 2026-08-03 - 2026-08-07\n' +
        '\n' +
        '## Ringkasan\n' +
        'Fokus minggu ini adalah menyelesaikan fondasi template.\n' +
        '\n' +
        '## Pencapaian\n' +
        '- Daily Report selesai\n' +
        '- Output dapat diedit\n' +
        '\n' +
        '## Metrik\n' +
        '- Template aktif: 1\n' +
        '- Test lulus: 91\n' +
        '\n' +
        '## Kendala\n' +
        'Tidak ada\n' +
        '\n' +
        '## Rencana minggu berikutnya\n' +
        '- Mulai Meeting Minutes\n' +
        '- Review template output',
    )
  })

  it('menggunakan fallback untuk metrik dan kendala yang kosong', () => {
    const output = renderWeeklyReport({ ...validInput, metrics: '', blockers: '' })

    expect(output).toContain('## Metrik\nTidak ada')
    expect(output).toContain('## Kendala\nTidak ada')
  })

  it('memvalidasi field wajib', () => {
    const result = weeklyReportGenerator.validate({
      ...validInput,
      summary: '',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'summary' }],
    })
  })

  it('memvalidasi tipe field opsional', () => {
    const result = weeklyReportGenerator.validate({
      ...validInput,
      metrics: 91,
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-text', fieldId: 'metrics' }],
    })
  })

  it('menghasilkan output Markdown saat execute', async () => {
    const result = await weeklyReportGenerator.execute(validInput, executionContext)

    expect(result).toMatchObject({
      status: 'success',
      output: { type: 'markdown', mimeType: 'text/markdown;charset=utf-8' },
    })
  })
})
