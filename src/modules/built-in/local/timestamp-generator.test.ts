import { describe, expect, it } from 'vitest'
import { timestampConverterGenerator } from './timestamp-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('timestampConverterGenerator', () => {
  it('mengonversi epoch zero seconds ke tanggal UTC', async () => {
    const result = await timestampConverterGenerator.execute(
      {
        mode: 'timestamp-to-date',
        value: '0',
        unit: 'seconds',
        timezone: 'UTC',
      },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'success',
      output: {
        content: expect.stringContaining('ISO 8601: 1970-01-01T00:00:00.000Z'),
      },
    })
  })

  it('mengonversi tanggal ISO ke timestamp milliseconds', async () => {
    const value = '2026-08-08T00:00:00.000Z'
    const result = await timestampConverterGenerator.execute(
      {
        mode: 'date-to-timestamp',
        value,
        unit: 'milliseconds',
        timezone: 'Asia/Jakarta',
      },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'success',
      output: {
        content: expect.stringContaining(`Timestamp (milliseconds): ${Date.parse(value)}`),
      },
    })
  })

  it('menerima input valid dan timezone IANA', () => {
    expect(
      timestampConverterGenerator.validate({
        mode: 'timestamp-to-date',
        value: '1720000000',
        unit: 'seconds',
        timezone: 'Asia/Jakarta',
      }),
    ).toEqual({ valid: true, issues: [] })
  })

  it('menolak timestamp yang bukan angka', () => {
    const result = timestampConverterGenerator.validate({
      mode: 'timestamp-to-date',
      value: 'not-a-timestamp',
      unit: 'seconds',
      timezone: 'UTC',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-date-value', fieldId: 'value' }],
    })
  })

  it('menolak timezone yang tidak dikenali', () => {
    const result = timestampConverterGenerator.validate({
      mode: 'timestamp-to-date',
      value: '0',
      unit: 'seconds',
      timezone: 'Mars/Olympus',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-timezone', fieldId: 'timezone' }],
    })
  })
})
