import { describe, expect, it } from 'vitest'
import { qrCodeGenerator } from './qr-code-generator'

describe('qrCodeGenerator', () => {
  it('menerima input QR yang valid', () => {
    expect(
      qrCodeGenerator.validate({
        text: 'https://workgen.local',
        size: 256,
        errorCorrection: 'medium',
      }),
    ).toEqual({ valid: true, issues: [] })
  })

  it('menolak teks kosong', () => {
    const result = qrCodeGenerator.validate({
      text: '   ',
      size: 256,
      errorCorrection: 'medium',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'text' }],
    })
  })

  it('menolak ukuran di luar batas', () => {
    const result = qrCodeGenerator.validate({
      text: 'WorkGen',
      size: 64,
      errorCorrection: 'medium',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'size-out-of-range', fieldId: 'size' }],
    })
  })

  it('menolak error correction yang tidak tersedia', () => {
    const result = qrCodeGenerator.validate({
      text: 'WorkGen',
      size: 256,
      errorCorrection: 'invalid',
    })

    expect(result).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-error-correction', fieldId: 'errorCorrection' }],
    })
  })

  it('mendeklarasikan output PNG dan capability download', () => {
    expect(qrCodeGenerator.definition.outputTypes).toEqual(['png'])
    expect(qrCodeGenerator.definition.capabilities).toMatchObject({
      offline: true,
      copy: false,
      download: true,
      network: false,
    })
  })
})
