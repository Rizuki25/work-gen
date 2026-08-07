import { describe, expect, it } from 'vitest'
import {
  base64Generator,
  decodeBase64Text,
  encodeBase64Text,
} from './base64-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-07T00:00:00.000Z'),
}

describe('base64Generator', () => {
  it('meng-encode teks ASCII ke Base64', () => {
    expect(encodeBase64Text('WorkGen')).toBe('V29ya0dlbg==')
  })

  it('melakukan round-trip teks Unicode menggunakan UTF-8', () => {
    const source = 'Halo WorkGen 🚀 — offline'

    expect(decodeBase64Text(encodeBase64Text(source))).toBe(source)
  })

  it('menerima mode Encode dan Decode yang valid', () => {
    expect(base64Generator.validate({ mode: 'encode', text: 'WorkGen' })).toEqual({
      valid: true,
      issues: [],
    })
    expect(base64Generator.validate({ mode: 'decode', text: 'V29ya0dlbg==' })).toEqual({
      valid: true,
      issues: [],
    })
  })

  it('menolak Base64 invalid saat mode Decode', () => {
    const result = base64Generator.validate({ mode: 'decode', text: 'not base64@@' })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-base64', fieldId: 'text' }],
    })
  })

  it('menolak input kosong', () => {
    const result = base64Generator.validate({ mode: 'encode', text: '' })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'text' }],
    })
  })

  it('menghasilkan output melalui execute', async () => {
    const result = await base64Generator.execute(
      { mode: 'decode', text: 'V29ya0dlbg==' },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'success',
      output: {
        content: 'WorkGen',
      },
    })
  })
})
