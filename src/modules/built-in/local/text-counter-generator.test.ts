import { describe, expect, it } from 'vitest'
import {
  countText,
  formatTextCounts,
  textCounterGenerator,
} from './text-counter-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-07T00:00:00.000Z'),
}

describe('textCounterGenerator', () => {
  it('menghitung karakter, karakter tanpa spasi, kata, dan baris', () => {
    expect(countText('Halo dunia\nWorkGen')).toEqual({
      characters: 18,
      charactersWithoutWhitespace: 16,
      words: 3,
      lines: 2,
    })
  })

  it('menghitung emoji sebagai satu karakter', () => {
    expect(countText('🚀')).toMatchObject({
      characters: 1,
      charactersWithoutWhitespace: 1,
      words: 1,
      lines: 1,
    })
  })

  it('menghasilkan format output yang konsisten', () => {
    expect(
      formatTextCounts({
        characters: 18,
        charactersWithoutWhitespace: 16,
        words: 3,
        lines: 2,
      }),
    ).toBe('Karakter: 18\nKarakter tanpa spasi: 16\nKata: 3\nBaris: 2')
  })

  it('menerima teks kosong sebagai input valid dengan nilai nol', () => {
    const validation = textCounterGenerator.validate({ text: '' })
    const counts = countText('')

    expect(validation).toEqual({ valid: true, issues: [] })
    expect(counts).toEqual({
      characters: 0,
      charactersWithoutWhitespace: 0,
      words: 0,
      lines: 0,
    })
  })

  it('menghasilkan output melalui execute', async () => {
    const result = await textCounterGenerator.execute(
      { text: 'Satu dua' },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'success',
      output: {
        type: 'plain-text',
        content: 'Karakter: 8\nKarakter tanpa spasi: 7\nKata: 2\nBaris: 1',
      },
    })
  })

  it('menolak input yang bukan string', () => {
    const result = textCounterGenerator.validate({ text: 42 })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-text', fieldId: 'text' }],
    })
  })
})
