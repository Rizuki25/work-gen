import { describe, expect, it, vi } from 'vitest'
import { generateWithAi } from './ai-service'
import type { ProviderConfig } from '../providers/provider-store'

const provider: ProviderConfig = {
  id: 'provider-ai-test',
  displayName: 'Provider AI test',
  type: 'openai-compatible',
  baseUrl: 'https://api.example.com/v1',
  model: 'example-model',
  apiKeyRef: 'secure:provider-ai-test:api-key',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
  isDefault: true,
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
}

const messages = [{ role: 'user' as const, content: 'Buat ringkasan singkat.' }]

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ai-service', () => {
  it('memblokir request tanpa persetujuan data', async () => {
    const fetchImpl = vi.fn<typeof fetch>()

    const result = await generateWithAi({
      provider,
      apiKey: 'secret-value',
      messages,
      consentGiven: false,
    }, { fetchImpl })

    expect(result).toMatchObject({
      status: 'failed',
      error: {
        code: 'consent-required',
        userMessage: 'Persetujuan diperlukan sebelum data dikirim ke provider AI.',
      },
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('memblokir request ketika provider belum dipilih', async () => {
    const fetchImpl = vi.fn<typeof fetch>()

    const result = await generateWithAi({
      apiKey: 'secret-value',
      messages,
      consentGiven: true,
    }, { fetchImpl })

    expect(result).toMatchObject({
      status: 'failed',
      error: { code: 'provider-required' },
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('meneruskan request yang disetujui dan mengembalikan text output', async () => {
    const fetchImpl: typeof fetch = async () => response({
      model: 'example-model',
      choices: [{ message: { content: 'Berikut ringkasannya.' } }],
    })

    const result = await generateWithAi({
      provider,
      apiKey: 'secret-value',
      messages,
      consentGiven: true,
      maxOutputTokens: 100,
      temperature: 0.2,
    }, { fetchImpl })

    expect(result).toMatchObject({
      status: 'success',
      text: 'Berikut ringkasannya.',
      model: 'example-model',
    })
  })

  it('meneruskan error provider tanpa membocorkan API key', async () => {
    const result = await generateWithAi({
      provider,
      apiKey: 'secret-value',
      messages,
      consentGiven: true,
    }, {
      fetchImpl: async () => response({ error: { message: 'provider detail' } }, 429),
    })

    expect(result).toMatchObject({
      status: 'failed',
      error: { code: 'rate-limit' },
    })
    expect(JSON.stringify(result)).not.toContain('secret-value')
  })
})
