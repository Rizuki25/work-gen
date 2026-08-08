import { describe, expect, it } from 'vitest'
import { generateDummyData, loremDummyGenerator } from './lorem-dummy-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('loremDummyGenerator', () => {
  it('menghasilkan jumlah lorem words yang diminta', () => {
    const result = generateDummyData('lorem-words', 6, 'id-ID')

    expect(result.outputType).toBe('plain-text')
    expect(result.content.split(' ')).toHaveLength(6)
  })

  it('menghasilkan jumlah paragraf dengan pemisah baris', () => {
    const result = generateDummyData('lorem-paragraphs', 3, 'en-US')

    expect(result.outputType).toBe('plain-text')
    expect(result.content.split('\n\n')).toHaveLength(3)
  })

  it('menghasilkan data nama dalam JSON array sesuai locale', () => {
    const result = generateDummyData('names', 5, 'id-ID')
    const names = JSON.parse(result.content) as string[]

    expect(result.outputType).toBe('json')
    expect(names).toHaveLength(5)
    expect(names.every((name) => name.split(' ').length === 2)).toBe(true)
  })

  it('menghasilkan records JSON dengan field yang konsisten', () => {
    const result = generateDummyData('records', 4, 'en-US')
    const records = JSON.parse(result.content) as Array<Record<string, unknown>>

    expect(records).toHaveLength(4)
    expect(records[0]).toEqual(
      expect.objectContaining({
        id: 1,
        name: expect.any(String),
        email: expect.stringMatching(/@example\.com$/),
        status: expect.any(String),
      }),
    )
  })

  it('menghasilkan numbers dan booleans sebagai JSON array', () => {
    const numbers = JSON.parse(generateDummyData('numbers', 8, 'id-ID').content) as unknown[]
    const booleans = JSON.parse(generateDummyData('booleans', 8, 'id-ID').content) as unknown[]

    expect(numbers).toHaveLength(8)
    expect(numbers.every((value) => typeof value === 'number')).toBe(true)
    expect(booleans).toHaveLength(8)
    expect(booleans.every((value) => typeof value === 'boolean')).toBe(true)
  })

  it('memvalidasi type, jumlah, dan locale', () => {
    expect(loremDummyGenerator.validate({ type: 'unknown', count: 1, locale: 'id-ID' })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-type', fieldId: 'type' }],
    })
    expect(
      loremDummyGenerator.validate({ type: 'lorem-paragraphs', count: 51, locale: 'id-ID' }),
    ).toMatchObject({
      valid: false,
      issues: [{ code: 'count-out-of-range', fieldId: 'count' }],
    })
    expect(loremDummyGenerator.validate({ type: 'names', count: 1, locale: 'fr-FR' })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-locale', fieldId: 'locale' }],
    })
  })

  it('menghasilkan output plain text atau JSON sesuai tipe execute', async () => {
    const textResult = await loremDummyGenerator.execute(
      { type: 'lorem-sentences', count: 2, locale: 'id-ID' },
      executionContext,
    )
    const jsonResult = await loremDummyGenerator.execute(
      { type: 'emails', count: 2, locale: 'en-US' },
      executionContext,
    )

    expect(textResult).toMatchObject({
      status: 'success',
      output: { type: 'plain-text', mimeType: 'text/plain;charset=utf-8' },
    })
    expect(jsonResult).toMatchObject({
      status: 'success',
      output: { type: 'json', mimeType: 'application/json;charset=utf-8' },
    })
  })
})
