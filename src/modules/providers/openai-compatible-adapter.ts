import type { ProviderConfig } from './provider-store'
import { normalizeBaseUrl } from './provider-store'

export type ProviderConnectionErrorCode =
  | 'validation'
  | 'offline'
  | 'timeout'
  | 'unauthorized'
  | 'not-found'
  | 'rate-limit'
  | 'server-error'
  | 'network'
  | 'malformed-response'
  | 'http-error'

export interface ProviderConnectionError {
  readonly code: ProviderConnectionErrorCode
  readonly userMessage: string
  readonly retryable: boolean
  readonly status?: number
}

export type ProviderTestConnectionResult =
  | {
      readonly status: 'success'
      readonly model: string
      readonly latencyMs: number
    }
  | {
      readonly status: 'failed'
      readonly error: ProviderConnectionError
    }

export interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

export interface ChatCompletionRequest {
  readonly messages: readonly ChatMessage[]
  readonly maxOutputTokens?: number
  readonly temperature?: number
}

export type ChatCompletionResult =
  | {
      readonly status: 'success'
      readonly text: string
      readonly model: string
      readonly latencyMs: number
    }
  | {
      readonly status: 'failed'
      readonly error: ProviderConnectionError
    }

export interface ProviderTestConnectionOptions {
  readonly fetchImpl?: typeof fetch
  readonly isOnline?: boolean
  readonly now?: () => number
  readonly signal?: AbortSignal
}

interface ChatCompletionPayload {
  readonly model: string
  readonly messages: readonly ChatMessage[]
  readonly max_tokens: number
  readonly temperature: number
}

export function buildChatCompletionsUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl)
  return normalized.length > 0 ? `${normalized}/chat/completions` : ''
}

function createError(
  code: ProviderConnectionErrorCode,
  userMessage: string,
  retryable: boolean,
  status?: number,
): ProviderConnectionError {
  return { code, userMessage, retryable, ...(status === undefined ? {} : { status }) }
}

function validateConnectionInput(provider: ProviderConfig, apiKey: string | undefined): ProviderConnectionError | undefined {
  const baseUrl = normalizeBaseUrl(provider.baseUrl)
  try {
    const url = new URL(baseUrl)
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.hostname.length === 0) {
      return createError('validation', 'Base URL harus berupa URL HTTP atau HTTPS yang valid.', false)
    }
  } catch {
    return createError('validation', 'Base URL harus berupa URL HTTP atau HTTPS yang valid.', false)
  }

  if (provider.model.trim().length === 0) {
    return createError('validation', 'Model diperlukan.', false)
  }

  if (!apiKey || apiKey.trim().length === 0) {
    return createError('validation', 'API key diperlukan untuk menguji koneksi.', false)
  }

  return undefined
}

function mapHttpError(status: number): ProviderConnectionError {
  if (status === 401 || status === 403) {
    return createError(
      'unauthorized',
      'Credential ditolak atau tidak memiliki akses ke model ini.',
      false,
      status,
    )
  }

  if (status === 404) {
    return createError(
      'not-found',
      'Endpoint atau model tidak ditemukan. Periksa Base URL dan model.',
      false,
      status,
    )
  }

  if (status === 429) {
    return createError(
      'rate-limit',
      'Batas penggunaan provider tercapai. Coba lagi nanti.',
      true,
      status,
    )
  }

  if (status >= 500 && status <= 599) {
    return createError(
      'server-error',
      'Provider sedang mengalami gangguan. Coba lagi nanti.',
      true,
      status,
    )
  }

  return createError(
    'http-error',
    `Provider mengembalikan HTTP ${status}. Periksa konfigurasi dan coba lagi.`,
    status >= 400,
    status,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getChatCompletionContent(value: unknown): { readonly text: string; readonly model?: string } | undefined {
  if (!isRecord(value) || !Array.isArray(value.choices) || value.choices.length === 0) {
    return undefined
  }

  const firstChoice = value.choices[0]
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return undefined
  }

  if (typeof firstChoice.message.content !== 'string') {
    return undefined
  }

  return {
    text: firstChoice.message.content,
    model: typeof value.model === 'string' ? value.model : undefined,
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

export async function requestChatCompletion(
  provider: ProviderConfig,
  apiKey: string | undefined,
  request: ChatCompletionRequest,
  options: ProviderTestConnectionOptions = {},
): Promise<ChatCompletionResult> {
  const validationError = validateConnectionInput(provider, apiKey)
  if (validationError) {
    return { status: 'failed', error: validationError }
  }

  if (request.messages.length === 0) {
    return {
      status: 'failed',
      error: createError('validation', 'Minimal satu message diperlukan untuk request AI.', false),
    }
  }

  const maxOutputTokens = request.maxOutputTokens ?? provider.maxOutputTokens
  const temperature = request.temperature ?? provider.temperature
  if (!Number.isFinite(maxOutputTokens) || maxOutputTokens < 1) {
    return {
      status: 'failed',
      error: createError('validation', 'Max output tokens harus lebih besar dari 0.', false),
    }
  }

  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
    return {
      status: 'failed',
      error: createError('validation', 'Temperature harus berada di antara 0 dan 2.', false),
    }
  }

  if (options.isOnline === false) {
    return {
      status: 'failed',
      error: createError('offline', 'Tidak ada koneksi internet untuk menguji provider.', true),
    }
  }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    return {
      status: 'failed',
      error: createError('network', 'Koneksi aman ke provider gagal.', true),
    }
  }

  const controller = new AbortController()
  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, Math.max(1000, provider.timeoutMs))
  const abortHandler = () => controller.abort()
  options.signal?.addEventListener('abort', abortHandler, { once: true })

  const now = options.now ?? Date.now
  const startedAt = now()
  const payload: ChatCompletionPayload = {
    model: provider.model.trim(),
    messages: request.messages,
    max_tokens: Math.floor(maxOutputTokens),
    temperature,
  }

  try {
    const response = await fetchImpl(buildChatCompletionsUrl(provider.baseUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey!.trim()}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      return { status: 'failed', error: mapHttpError(response.status) }
    }

    const responseBody = await readJson(response)
    const completion = getChatCompletionContent(responseBody)
    if (!completion) {
      return {
        status: 'failed',
        error: createError(
          'malformed-response',
          'Response provider tidak memiliki format chat completion yang valid.',
          false,
        ),
      }
    }

    return {
      status: 'success',
      text: completion.text,
      model: completion.model ?? provider.model,
      latencyMs: Math.max(0, now() - startedAt),
    }
  } catch (error) {
    if (timedOut || isAbortError(error)) {
      return {
        status: 'failed',
        error: createError('timeout', 'Provider tidak merespons dalam batas waktu.', true),
      }
    }

    return {
      status: 'failed',
      error: createError('network', 'Koneksi aman ke provider gagal.', true),
    }
  } finally {
    clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', abortHandler)
  }
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError'
}

export async function testProviderConnection(
  provider: ProviderConfig,
  apiKey: string | undefined,
  options: ProviderTestConnectionOptions = {},
): Promise<ProviderTestConnectionResult> {
  const result = await requestChatCompletion(
    provider,
    apiKey,
    {
      messages: [{ role: 'user', content: 'Respond with OK only.' }],
      maxOutputTokens: 1,
      temperature: 0,
    },
    options,
  )

  if (result.status === 'failed') {
    return result
  }

  return {
    status: 'success',
    model: result.model,
    latencyMs: result.latencyMs,
  }
}
