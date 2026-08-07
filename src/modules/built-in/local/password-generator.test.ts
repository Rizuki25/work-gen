import { describe, expect, it } from 'vitest'
import {
  passwordGenerator,
  selectedPasswordGroups,
  validatePasswordInput,
} from './password-generator'

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-07T00:00:00.000Z'),
}

const validInput = {
  length: 16,
  count: 3,
  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true,
}

describe('passwordGenerator', () => {
  it('menerima konfigurasi password yang valid', () => {
    expect(validatePasswordInput(validInput)).toEqual({ valid: true, issues: [] })
    expect(selectedPasswordGroups(validInput)).toHaveLength(4)
  })

  it('menolak konfigurasi tanpa kelompok karakter', () => {
    const result = validatePasswordInput({
      ...validInput,
      includeLowercase: false,
      includeUppercase: false,
      includeNumbers: false,
      includeSymbols: false,
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'no-character-group' }],
    })
  })

  it('menolak panjang yang lebih pendek daripada kelompok karakter terpilih', () => {
    const result = validatePasswordInput({ ...validInput, length: 2 })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'length-out-of-range' }],
    })
  })

  it('menghasilkan jumlah password dengan panjang dan kelompok karakter yang benar', async () => {
    const result = await passwordGenerator.execute(validInput, executionContext)

    expect(result.status).toBe('success')
    if (result.status !== 'success') {
      return
    }

    const passwords = result.output.content.toString().split('\n')
    expect(passwords).toHaveLength(3)
    for (const password of passwords) {
      expect(password).toHaveLength(16)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[!@#$%^&*()\-_=+\[\]{};:,.?/|~]/)
    }
  })

  it('mengembalikan error terstruktur untuk input invalid saat execute', async () => {
    const result = await passwordGenerator.execute(
      { ...validInput, count: 0 },
      executionContext,
    )

    expect(result).toMatchObject({
      status: 'failed',
      error: {
        code: 'count-out-of-range',
        fieldId: 'count',
        retryable: false,
      },
    })
  })
})
