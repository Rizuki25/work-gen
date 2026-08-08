import { describe, expect, it, vi } from 'vitest'
import {
  buildChatCompletionsUrl,
  testProviderConnection,
} from './openai-compatible-adapter'
import type { ProviderConfig } from './provider-store'

const provider: ProviderConfig = {
  id: 'provider-test',
  displayName: 'Provider test',
  type: 'openai-compatible',
  baseUrl: 'https://api.example.com/v1/',
  model: 'example-model',
  apiKeyRef: 'secure:provider-test:api-key',
  timeoutMs: 60000,
  maxOutputTokens: 2048,
  temperature: 0.3,
  isDefault: true,
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('openai-compatible-adapter', () => {
  it('membentuk endpoint chat completions dari Base URL', () => {
    expect(buildChatCompletionsUrl('https://api.example.com/v1/')).toBe(
      'https://api.example.com/v1/chat/completions',
    )
  })

  it('memblokir API key kosong sebelum network call', async () => {
    const fetchImpl = vi.fn<typeof fetch>()

    const result = await testProviderConnection(provider, '', { fetchImpl })

    expect(result).toMatchObject({
      status: 'failed',
      error: {
        code: 'validation',
        userMessage: 'API key diperlukan untuk menguji koneksi.',
      },
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('mengirim request minimal dengan authorization dan menerima response valid', async () => {
    let capturedInput: RequestInfo | URL | undefined
    let capturedInit: RequestInit | undefined
    const fetchImpl: typeof fetch = async (input, init) => {
      capturedInput = input
      capturedInit = init
      return response({
        model: 'example-model',
        choices: [{ message: { content: 'OK' } }],
      })
    }

    const result = await testProviderConnection(provider, 'secret-value', {
      fetchImpl,
      now: (() => {
        let value = 100
        return () => {
          value += 25
          return value
        }
      })(),
    })

    expect(result).toMatchObject({ status: 'success', model: 'example-model', latencyMs: 25 })
    expect(capturedInput).toBe('https://api.example.com/v1/chat/completions')
    expect(capturedInit?.headers).toMatchObject({ Authorization: 'Bearer secret-value' })
    expect(JSON.parse(String(capturedInit?.body))).toMatchObject({
      model: 'example-model',
      max_tokens: 1,
      temperature: 0,
    })
  })

  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [404, 'not-found'],
    [429, 'rate-limit'],
    [503, 'server-error'],
  ] as const)('memetakan HTTP %s menjadi error %s', async (status, code) => {
    const result = await testProviderConnection(provider, 'secret-value', {
      fetchImpl: async () => response({ error: { message: 'provider detail' } }, status),
    })

    expect(result).toMatchObject({ status: 'failed', error: { code, status } })
    expect(JSON.stringify(result)).not.toContain('secret-value')
  })

  it('mengembalikan offline tanpa network call', async () => {
    const fetchImpl = vi.fn<typeof fetch>()

    const result = await testProviderConnection(provider, 'secret-value', {
      fetchImpl,
      isOnline: false,
    })

    expect(result).toMatchObject({ status: 'failed', error: { code: 'offline' } })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('memetakan response sukses yang malformed', async () => {
    const result = await testProviderConnection(provider, 'secret-value', {
      fetchImpl: async () => response({ model: 'example-model', choices: [] }),
    })

    expect(result).toMatchObject({
      status: 'failed',
      error: { code: 'malformed-response' },
    })
  })

  it('memetakan abort dari timeout', async () => {
    vi.useFakeTimers()

    try {
      const fetchImpl: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
      const resultPromise = testProviderConnection(
        { ...provider, timeoutMs: 1000 },
        'secret-value',
        { fetchImpl },
      )

      await vi.advanceTimersByTimeAsync(1000)

      await expect(resultPromise).resolves.toMatchObject({
        status: 'failed',
        error: { code: 'timeout' },
      })
    } finally {
      vi.useRealTimers()
    }
  })
})
