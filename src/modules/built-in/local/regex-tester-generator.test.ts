import { describe, expect, it } from 'vitest'
import {
  regexTesterGenerator,
  testRegex,
} from './regex-tester-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('regexTesterGenerator', () => {
  it('menghasilkan semua match, capture group, dan posisi dengan flag g', () => {
    const result = testRegex(
      '(?<word>WorkGen)',
      'WorkGen tools. WorkGen tetap lokal.',
      'g',
    )

    expect(result).toMatchObject({
      matched: true,
      matchCount: 2,
      sampleLength: 35,
      matches: [
        {
          match: 'WorkGen',
          index: 0,
          end: 7,
          groups: ['WorkGen'],
          namedGroups: { word: 'WorkGen' },
        },
        {
          match: 'WorkGen',
          index: 15,
          end: 22,
          groups: ['WorkGen'],
          namedGroups: { word: 'WorkGen' },
        },
      ],
    })
  })

  it('hanya mengambil match pertama tanpa flag g', () => {
    const result = testRegex('tool', 'tool lokal, tool privat', 'i')

    expect(result.matchCount).toBe(1)
    expect(result.matches[0]).toMatchObject({ match: 'tool', index: 0, end: 4 })
  })

  it('menghasilkan hasil tidak match tanpa error', () => {
    const result = testRegex('cloud', 'WorkGen local-first', 'g')

    expect(result).toMatchObject({ matched: false, matchCount: 0, matches: [] })
  })

  it('mencegah loop pada zero-length match dengan flag g', () => {
    const result = testRegex('a*', 'bbb', 'g')

    expect(result.matchCount).toBe(4)
    expect(result.matches.every((match) => match.match === '')).toBe(true)
  })

  it('menolak pattern Regex yang tidak valid', () => {
    const result = regexTesterGenerator.validate({
      pattern: '[a-',
      sample: 'abc',
      flags: 'g',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-pattern', fieldId: 'pattern' }],
    })
  })

  it('menolak flags yang berulang atau tidak didukung', () => {
    expect(regexTesterGenerator.validate({ pattern: 'a', sample: 'a', flags: 'gg' })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-flags', fieldId: 'flags' }],
    })
    expect(regexTesterGenerator.validate({ pattern: 'a', sample: 'a', flags: 'x' })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-flags', fieldId: 'flags' }],
    })
  })

  it('menghasilkan output JSON saat execute', async () => {
    const result = await regexTesterGenerator.execute(
      { pattern: '\\d+', sample: 'ID 123 dan 456', flags: 'g' },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'success',
      output: {
        type: 'json',
        mimeType: 'application/json;charset=utf-8',
      },
    })

    if (result.status === 'success') {
      expect(result.output.content).toContain('"matchCount": 2')
    }
  })
})
