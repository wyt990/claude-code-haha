import { APIError } from '@anthropic-ai/sdk'
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { BetaMessage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { buildOpenAIChatCompletionBody } from './anthropicParamsToOpenAI.js'
import { mergeAbortSignals } from './config.js'
import { resolveOpenAICompatRouting } from './compatRouting.js'
import { mergeOpenAICompatExtraBody } from './extraBody.js'
import { openAICompletionJsonToBetaMessage } from './openaiResponseToBetaMessage.js'

function getFetchTimeoutMs(): number {
  const env = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env
  const n = parseInt(env?.API_TIMEOUT_MS || '', 10)
  return n > 0 ? n : 600_000
}

/**
 * OpenAI Chat Completions 非流式请求，返回与 Anthropic `beta.messages.create` 对齐的 `BetaMessage`。
 */
export async function openAICompatNonStreamingRequest(
  params: BetaMessageStreamParams,
  signal: AbortSignal,
  fetchOverride?: typeof fetch,
): Promise<BetaMessage> {
  const route = resolveOpenAICompatRouting(String(params.model))
  const bodyParams =
    route.bodyModel === params.model
      ? params
      : { ...params, model: route.bodyModel }
  const body = buildOpenAIChatCompletionBody(bodyParams, { stream: false })
  mergeOpenAICompatExtraBody(body)
  body.stream = false

  const url = route.url
  const headers: Record<string, string> = {
    ...route.headers,
    'Content-Type': 'application/json',
  }

  const fetchFn = fetchOverride ?? globalThis.fetch
  const timeoutCtrl = new AbortController()
  const timeoutMs = getFetchTimeoutMs()
  const timer = setTimeout(() => timeoutCtrl.abort(), timeoutMs)
  const merged = mergeAbortSignals(signal, timeoutCtrl.signal)

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: merged,
    })

    if (!response.ok) {
      const text = await response.text()
      let errBody: unknown = text
      try {
        errBody = JSON.parse(text) as unknown
      } catch {
        /* keep text */
      }
      throw APIError.generate(
        response.status,
        errBody,
        undefined,
        response.headers,
      )
    }

    const json = (await response.json()) as Record<string, unknown>
    return openAICompletionJsonToBetaMessage(json, String(bodyParams.model))
  } finally {
    clearTimeout(timer)
  }
}

export function betaMessageAssistantText(message: BetaMessage): string {
  const parts: string[] = []
  for (const b of message.content) {
    if (b.type === 'text') {
      parts.push(b.text)
    }
  }
  return parts.join('\n')
}
