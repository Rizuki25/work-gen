import {
  requestChatCompletion,
  type ChatCompletionResult,
  type ChatMessage,
  type ProviderConnectionErrorCode,
  type ProviderTestConnectionOptions,
} from '../providers/openai-compatible-adapter'
import type { ProviderConfig } from '../providers/provider-store'

export type AiServiceErrorCode = 'consent-required' | 'provider-required' | ProviderConnectionErrorCode

export interface AiServiceError {
  readonly code: AiServiceErrorCode
  readonly userMessage: string
  readonly retryable: boolean
  readonly status?: number
}

export interface AiGenerationRequest {
  readonly provider?: ProviderConfig
  readonly apiKey?: string
  readonly messages: readonly ChatMessage[]
  readonly consentGiven: boolean
  readonly maxOutputTokens?: number
  readonly temperature?: number
}

export type AiGenerationResult =
  | {
      readonly status: 'success'
      readonly text: string
      readonly model: string
      readonly latencyMs: number
    }
  | {
      readonly status: 'failed'
      readonly error: AiServiceError
    }

export interface AiGenerationOptions extends Omit<ProviderTestConnectionOptions, 'now'> {
  readonly now?: () => number
}

function serviceError(
  code: AiServiceErrorCode,
  userMessage: string,
  retryable: boolean,
  status?: number,
): AiServiceError {
  return { code, userMessage, retryable, ...(status === undefined ? {} : { status }) }
}

export async function generateWithAi(
  request: AiGenerationRequest,
  options: AiGenerationOptions = {},
): Promise<AiGenerationResult> {
  if (!request.consentGiven) {
    return {
      status: 'failed',
      error: serviceError(
        'consent-required',
        'Persetujuan diperlukan sebelum data dikirim ke provider AI.',
        false,
      ),
    }
  }

  if (!request.provider) {
    return {
      status: 'failed',
      error: serviceError('provider-required', 'Pilih provider AI sebelum membuat request.', false),
    }
  }

  const result: ChatCompletionResult = await requestChatCompletion(
    request.provider,
    request.apiKey,
    {
      messages: request.messages,
      maxOutputTokens: request.maxOutputTokens,
      temperature: request.temperature,
    },
    options,
  )

  return result
}
