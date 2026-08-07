import { describe, expect, it } from 'vitest'
import { hashGenerator, hashText } from './hash-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-07T00:00:00.000Z'),
}

describe('hashGenerator', () => {
  it('menghasilkan SHA-256 hex yang dikenal untuk teks hello', async () => {
    await expect(hashText('hello', 'SHA-256', 'hex')).resolves.toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    )
  })

  it('menghasilkan panjang digest yang sesuai untuk SHA-512 Base64', async () => {
    const result = await hashText('WorkGen', 'SHA-512', 'base64')

    expect(result).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
    expect(globalThis.atob(result)).toHaveLength(64)
  })

  it('menerima teks kosong dan pilihan algoritma/encoding valid', () => {
    expect(
      hashGenerator.validate({ text: '', algorithm: 'SHA-384', encoding: 'hex' }),
    ).toEqual({ valid: true, issues: [] })
  })

  it('menolak algoritma yang tidak didukung', () => {
    const result = hashGenerator.validate({
      text: 'WorkGen',
      algorithm: 'SHA-1',
      encoding: 'hex',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-algorithm', fieldId: 'algorithm' }],
    })
  })

  it('menolak encoding output yang tidak didukung', () => {
    const result = hashGenerator.validate({
      text: 'WorkGen',
      algorithm: 'SHA-256',
      encoding: 'binary',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-encoding', fieldId: 'encoding' }],
    })
  })

  it('menghasilkan output melalui execute', async () => {
    const result = await hashGenerator.execute(
      { text: 'hello', algorithm: 'SHA-256', encoding: 'hex' },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'success',
      output: {
        content: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      },
    })
  })
})
