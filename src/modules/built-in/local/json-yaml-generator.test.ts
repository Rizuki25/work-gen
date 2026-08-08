import { describe, expect, it } from 'vitest'
import {
  convertJsonToYaml,
  convertYamlToJson,
  jsonYamlGenerator,
} from './json-yaml-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

describe('jsonYamlGenerator', () => {
  it('mengubah JSON valid menjadi YAML', () => {
    const yaml = convertJsonToYaml('{"name":"WorkGen","offline":true,"items":["local"]}')

    expect(yaml).toContain('name: WorkGen')
    expect(yaml).toContain('offline: true')
    expect(yaml).toContain('items:')
    expect(yaml).toContain('- local')
  })

  it('mengubah YAML valid menjadi JSON terformat', () => {
    const json = convertYamlToJson('name: WorkGen\noffline: true\nitems:\n  - local\n')

    expect(json).toBe(
      '{\n  "name": "WorkGen",\n  "offline": true,\n  "items": [\n    "local"\n  ]\n}',
    )
  })

  it('menerima dua mode konversi yang valid', () => {
    expect(jsonYamlGenerator.validate({ mode: 'json-to-yaml', value: '{"ok":true}' })).toEqual({
      valid: true,
      issues: [],
    })
    expect(jsonYamlGenerator.validate({ mode: 'yaml-to-json', value: 'ok: true' })).toEqual({
      valid: true,
      issues: [],
    })
  })

  it('menolak JSON invalid', () => {
    const result = jsonYamlGenerator.validate({ mode: 'json-to-yaml', value: '{"ok":}' })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-json', fieldId: 'value' }],
    })
  })

  it('menolak YAML invalid', () => {
    const result = jsonYamlGenerator.validate({
      mode: 'yaml-to-json',
      value: 'items: [first, second',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-yaml', fieldId: 'value' }],
    })
  })

  it('menghasilkan output JSON atau YAML sesuai mode execute', async () => {
    const yamlResult = await jsonYamlGenerator.execute(
      { mode: 'json-to-yaml', value: '{"name":"WorkGen"}' },
      executionContext,
    )
    const jsonResult = await jsonYamlGenerator.execute(
      { mode: 'yaml-to-json', value: 'name: WorkGen' },
      executionContext,
    )

    expect(yamlResult).toMatchObject({ status: 'success', output: { type: 'yaml' } })
    expect(jsonResult).toMatchObject({ status: 'success', output: { type: 'json' } })
  })
})
