import { describe, expect, it } from 'vitest'
import {
  formatJson,
  jsonFormatterGenerator,
} from './json-formatter-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-07T00:00:00.000Z'),
}

describe('jsonFormatterGenerator', () => {
  it('memformat JSON valid dengan indentasi dua spasi', () => {
    const source = '{"name":"WorkGen","features":["local","template"]}'

    expect(formatJson(source)).toBe(
      '{\n  "name": "WorkGen",\n  "features": [\n    "local",\n    "template"\n  ]\n}',
    )
  })

  it('menerima input JSON valid saat validasi', () => {
    const result = jsonFormatterGenerator.validate({
      json: '{"offline":true}',
    })

    expect(result).toEqual({ valid: true, issues: [] })
  })

  it('menolak input kosong', () => {
    const result = jsonFormatterGenerator.validate({ json: '   ' })

    expect(result.valid).toBe(false)
    expect(result.issues[0]).toMatchObject({
      code: 'required',
      fieldId: 'json',
    })
  })

  it('menolak JSON invalid dengan pesan yang dapat ditindaklanjuti', () => {
    const result = jsonFormatterGenerator.validate({
      json: '{"name":"WorkGen",}',
    })

    expect(result.valid).toBe(false)
    expect(result.issues[0]).toMatchObject({
      code: 'invalid-json',
      fieldId: 'json',
    })
    expect(result.issues[0]?.message).toContain('JSON tidak valid')
  })

  it('menghasilkan output sukses melalui kontrak execute', async () => {
    const result = await jsonFormatterGenerator.execute(
      { json: '{"name":"WorkGen"}' },
      executionContext,
    )

    expect(result).toEqual({
      status: 'success',
      output: {
        type: 'json',
        mimeType: 'application/json;charset=utf-8',
        content: '{\n  "name": "WorkGen"\n}',
      },
    })
  })

  it('mengembalikan error terstruktur saat execute menerima JSON invalid', async () => {
    const result = await jsonFormatterGenerator.execute(
      { json: '{"name":}' },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'failed',
      error: {
        code: 'invalid-json',
        fieldId: 'json',
        retryable: false,
      },
    })
  })
})
