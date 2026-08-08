import { describe, expect, it, vi } from 'vitest'
import {
  buildFreeformMessages,
  freeformTextGenerator,
} from './freeform-text-generator'
import type { GeneratorAiRuntime } from '../../contracts/generator'
import type { ProviderConfig } from '../../providers/provider-store'

const provider: ProviderConfig = {
  id: 'provider-freeform-test',
  displayName: 'Provider test',
  type: 'openai-compatible',
  baseUrl: 'https://api.example.com/v1',
  model: 'example-model',
  apiKeyRef: 'secure:provider-freeform-test:api-key',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
  isDefault: true,
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
}

const validInput = {
  instruction: 'Buat email singkat untuk meminta review dokumen.',
  context: 'Penerima adalah lead tim dan batas waktunya Jumat.',
  tone: 'professional',
  length: 'short',
  format: 'markdown',
} as const

const executionContext = {
  locale: 'id-ID',
  timezone: 'Asia/Jakarta',
  now: () => new Date('2026-08-08T00:00:00.000Z'),
}

function createAiRuntime(
  result: Awaited<ReturnType<GeneratorAiRuntime['generate']>> = {
    status: 'success',
    text: '## Draft email\nMohon review dokumen.',
    model: 'example-model',
    latencyMs: 120,
  },
): GeneratorAiRuntime {
  return {
    provider,
    generate: vi.fn(async () => result),
  }
}

describe('freeformTextGenerator', () => {
  it('membangun messages dengan instruksi, konteks, tone, panjang, dan format', () => {
    expect(buildFreeformMessages(validInput)).toEqual([
      {
        role: 'system',
        content: 'Anda adalah asisten penulisan WorkGen. Ikuti instruksi pengguna dan jangan menambahkan klaim yang tidak didukung konteks.',
      },
      {
        role: 'user',
        content: 'Instruksi:\nBuat email singkat untuk meminta review dokumen.\n\n' +
          'Konteks:\nPenerima adalah lead tim dan batas waktunya Jumat.\n\n' +
          'Tone: professional\n\nPanjang: short\n\nFormat: Gunakan Markdown sederhana jika heading atau daftar membantu.',
      },
    ])
  })

  it('memvalidasi instruksi dan enum field', () => {
    expect(freeformTextGenerator.validate({ ...validInput, instruction: '' })).toMatchObject({
      valid: false,
      issues: [{ code: 'required', fieldId: 'instruction' }],
    })
    expect(freeformTextGenerator.validate({ ...validInput, tone: 'unknown' })).toMatchObject({
      valid: false,
      issues: [{ code: 'invalid-tone', fieldId: 'tone' }],
    })
  })

  it('menolak execute tanpa provider atau consent', async () => {
    const noProvider = await freeformTextGenerator.execute(validInput, executionContext)
    expect(noProvider).toMatchObject({
      status: 'failed',
      error: { code: 'provider-required' },
    })

    const noConsent = await freeformTextGenerator.execute(validInput, {
      ...executionContext,
      ai: createAiRuntime(),
      aiConsentGiven: false,
    })
    expect(noConsent).toMatchObject({
      status: 'failed',
      error: { code: 'consent-required' },
    })
  })

  it('menghasilkan output Markdown melalui runtime AI', async () => {
    const ai = createAiRuntime()
    const result = await freeformTextGenerator.execute(validInput, {
      ...executionContext,
      ai,
      aiConsentGiven: true,
    })

    expect(result).toMatchObject({
      status: 'success',
      output: {
        type: 'markdown',
        mimeType: 'text/markdown;charset=utf-8',
        content: '## Draft email\nMohon review dokumen.',
      },
    })
    expect(ai.generate).toHaveBeenCalledWith(expect.objectContaining({
      consentGiven: true,
      maxOutputTokens: 512,
      temperature: 0.4,
    }))
  })

  it('mempertahankan error provider sebagai error generator', async () => {
    const ai = createAiRuntime({
      status: 'failed',
      error: {
        code: 'rate-limit',
        userMessage: 'Batas penggunaan provider tercapai. Coba lagi nanti.',
        retryable: true,
      },
    })
    const result = await freeformTextGenerator.execute(validInput, {
      ...executionContext,
      ai,
      aiConsentGiven: true,
    })

    expect(result).toMatchObject({
      status: 'failed',
      error: { code: 'rate-limit', retryable: true },
    })
  })
})
