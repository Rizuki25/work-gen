import { describe, expect, it } from 'vitest'
import { meetingMinutesGenerator, renderMeetingMinutes } from './meeting-minutes-generator'

const validInput = {
  title: 'Sprint Planning',
  date: '2026-08-08',
  participants: 'Ayu\nBima',
  agenda: 'Review progres\nBahas risiko',
  discussion: 'Tim membahas progres sprint.\nRisiko utama sudah dipetakan.',
  decisions: 'Prioritaskan bug kritis',
  actionItems: 'Siapkan draft laporan\nJadwalkan follow-up',
  owner: 'Ayu',
  dueDate: '2026-08-12',
}

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('meetingMinutesGenerator', () => {
  it('merender output Markdown konsisten sebagai golden output', () => {
    expect(renderMeetingMinutes(validInput, 'markdown')).toBe(
      '# Meeting Minutes - Sprint Planning\n' +
        '\n' +
        '**Tanggal:** 2026-08-08\n' +
        '**Owner:** Ayu\n' +
        '**Due date:** 2026-08-12\n' +
        '\n' +
        '## Peserta\n' +
        '- Ayu\n' +
        '- Bima\n' +
        '\n' +
        '## Agenda\n' +
        '- Review progres\n' +
        '- Bahas risiko\n' +
        '\n' +
        '## Pembahasan\n' +
        'Tim membahas progres sprint.\n' +
        'Risiko utama sudah dipetakan.\n' +
        '\n' +
        '## Keputusan\n' +
        '- Prioritaskan bug kritis\n' +
        '\n' +
        '## Action items\n' +
        '- Siapkan draft laporan\n' +
        '- Jadwalkan follow-up',
    )
  })

  it('menggunakan fallback untuk bagian opsional yang kosong', () => {
    const output = renderMeetingMinutes(
      { ...validInput, decisions: '', actionItems: '', owner: '', dueDate: '' },
      'plain-text',
    )

    expect(output).toContain('Owner: Tidak ada')
    expect(output).toContain('Due date: Tidak ada')
    expect(output).toContain('KEPUTUSAN\n---------\nTidak ada')
    expect(output).toContain('ACTION ITEMS\n------------\nTidak ada')
  })

  it('memvalidasi field wajib', () => {
    const result = meetingMinutesGenerator.validate({
      ...validInput,
      agenda: '',
      format: 'markdown',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'agenda' }],
    })
  })

  it('memvalidasi tanggal rapat dan due date', () => {
    expect(
      meetingMinutesGenerator.validate({ ...validInput, date: '2026-02-30', format: 'markdown' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-date', fieldId: 'date' }],
    })
    expect(
      meetingMinutesGenerator.validate({ ...validInput, dueDate: '2026-02-31', format: 'markdown' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-date', fieldId: 'dueDate' }],
    })
  })

  it('menghasilkan Markdown atau plain text sesuai format execute', async () => {
    const markdownResult = await meetingMinutesGenerator.execute(
      { ...validInput, format: 'markdown' },
      executionContext,
    )
    const plainTextResult = await meetingMinutesGenerator.execute(
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
