import { describe, expect, it } from 'vitest'
import {
  convertCsvToJson,
  convertJsonToCsv,
  csvJsonGenerator,
  parseCsv,
} from './csv-json-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('csvJsonGenerator', () => {
  it('mengubah CSV menjadi JSON dengan quoted value', () => {
    const json = convertCsvToJson(
      'name,role,note\r\nWorkGen,Local,"Private, offline"\r\nR&D,Tool,"He said ""hi"""',
    )

    expect(json).toBe(
      '[\n' +
        '  {\n' +
        '    "name": "WorkGen",\n' +
        '    "role": "Local",\n' +
        '    "note": "Private, offline"\n' +
        '  },\n' +
        '  {\n' +
        '    "name": "R&D",\n' +
        '    "role": "Tool",\n' +
        '    "note": "He said \\"hi\\""\n' +
        '  }\n' +
        ']',
    )
  })

  it('mengubah JSON array of object menjadi CSV dengan delimiter semicolon', () => {
    const csv = convertJsonToCsv(
      '[{"name":"WorkGen","active":true,"note":"private; local"},{"name":"Tool","active":false,"note":"safe"}]',
      ';',
    )

    expect(csv).toBe(
      'name;active;note\r\nWorkGen;true;"private; local"\r\nTool;false;safe',
    )
  })

  it('mempertahankan field yang memiliki newline dan escaped quote', () => {
    const rows = parseCsv('name,note\nWorkGen,"line one\nline two, said ""ok"""')

    expect(rows).toEqual([
      ['name', 'note'],
      ['WorkGen', 'line one\nline two, said "ok"'],
    ])
  })

  it('menerima mode dan delimiter yang tersedia', () => {
    expect(
      csvJsonGenerator.validate({
        mode: 'csv-to-json',
        delimiter: 'tab',
        value: 'name\tWorkGen',
      }),
    ).toEqual({ valid: true, issues: [] })
    expect(
      csvJsonGenerator.validate({
        mode: 'json-to-csv',
        delimiter: 'comma',
        value: '[{"ok":true}]',
      }),
    ).toEqual({ valid: true, issues: [] })
  })

  it('menolak CSV dengan jumlah kolom yang tidak konsisten', () => {
    const result = csvJsonGenerator.validate({
      mode: 'csv-to-json',
      delimiter: 'comma',
      value: 'name,role\nWorkGen,Local,Extra',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-csv', fieldId: 'value' }],
    })
  })

  it('menolak JSON yang bukan array object', () => {
    const result = csvJsonGenerator.validate({
      mode: 'json-to-csv',
      delimiter: 'comma',
      value: '{"name":"WorkGen"}',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-json', fieldId: 'value' }],
    })
  })

  it('menghasilkan output JSON atau CSV sesuai mode execute', async () => {
    const jsonResult = await csvJsonGenerator.execute(
      { mode: 'csv-to-json', delimiter: 'comma', value: 'name\nWorkGen' },
      executionContext,
    )
    const csvResult = await csvJsonGenerator.execute(
      { mode: 'json-to-csv', delimiter: 'comma', value: '[{"name":"WorkGen"}]' },
      executionContext,
    )

    expect(jsonResult).toMatchObject({ status: 'success', output: { type: 'json' } })
    expect(csvResult).toMatchObject({ status: 'success', output: { type: 'csv' } })
  })
})
