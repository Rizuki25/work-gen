import { describe, expect, it } from 'vitest'
import {
  createUuidV4,
  formatUuid,
  uuidGenerator,
} from './uuid-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-07T00:00:00.000Z'),
}

describe('uuidGenerator', () => {
  it('membuat UUID v4 dengan version dan variant yang benar', () => {
    const uuid = createUuidV4()

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('menerapkan format uppercase dan braced', () => {
    const uuid = '123e4567-e89b-42d3-a456-426614174000'

    expect(formatUuid(uuid, 'uppercase')).toBe('123E4567-E89B-42D3-A456-426614174000')
    expect(formatUuid(uuid, 'braced')).toBe('{123e4567-e89b-42d3-a456-426614174000}')
  })

  it('menerima jumlah dan format yang valid', () => {
    const result = uuidGenerator.validate({ count: 3, format: 'uppercase' })

    expect(result).toEqual({ valid: true, issues: [] })
  })

  it('menolak jumlah di luar rentang', () => {
    const result = uuidGenerator.validate({ count: 0, format: 'lowercase' })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'count-out-of-range', fieldId: 'count' }],
    })
  })

  it('menolak format yang tidak dikenal', () => {
    const result = uuidGenerator.validate({ count: 1, format: 'urn' })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-format', fieldId: 'format' }],
    })
  })

  it('menghasilkan jumlah UUID sesuai input melalui execute', async () => {
    const result = await uuidGenerator.execute(
      { count: 4, format: 'uppercase' },
      executionContext,
    )

    expect(result.status).toBe('success')
    if (result.status !== 'success') {
      return
    }

    const lines = result.output.content.toString().split('\n')
    expect(lines).toHaveLength(4)
    expect(lines.every((line) => /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/.test(line))).toBe(true)
  })
})
