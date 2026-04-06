import type Anthropic from '@anthropic-ai/sdk'
import { APIConnectionError, APIError } from '@anthropic-ai/sdk'
import type {
  BetaMessage,
  BetaMessageDeltaUsage,
  BetaMessageStreamParams,
  BetaRawMessageStreamEvent,
  BetaStopReason,
  BetaUsage,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { Stream } from '@anthropic-ai/sdk/streaming.mjs'
import { randomUUID } from 'crypto'
import { buildOpenAIChatCompletionBody } from './anthropicParamsToOpenAI.js'
import { mergeAbortSignals } from './config.js'
import { resolveOpenAICompatRouting } from './compatRouting.js'
import { mergeOpenAICompatExtraBody } from './extraBody.js'

function emptyBetaUsage(): BetaUsage {
  return {
    cache_creation: null,
    cache_creation_input_tokens: null,
    cache_read_input_tokens: null,
    inference_geo: null,
    input_tokens: 0,
    iterations: null,
    output_tokens: 0,
    server_tool_use: null,
    service_tier: null,
    speed: null,
  }
}

function emptyDeltaUsage(): BetaMessageDeltaUsage {
  return {
    cache_creation_input_tokens: null,
    cache_read_input_tokens: null,
    input_tokens: null,
    iterations: null,
    output_tokens: 0,
    server_tool_use: null,
  }
}

function makeMessageStart(model: string, msgId: string): BetaRawMessageStreamEvent {
  const message: BetaMessage = {
    id: msgId,
    container: null,
    content: [],
    context_management: null,
    model,
    role: 'assistant',
    stop_reason: null,
    stop_sequence: null,
    type: 'message',
    usage: emptyBetaUsage(),
  }
  return { type: 'message_start', message }
}

function mapFinishReason(
  fr: string | null | undefined,
): BetaStopReason | null {
  if (!fr) return null
  switch (fr) {
    case 'stop':
      return 'end_turn'
    case 'length':
      return 'max_tokens'
    case 'tool_calls':
      return 'tool_use'
    case 'content_filter':
      return 'refusal'
    default:
      return 'end_turn'
  }
}

type ToolAcc = {
  blockIndex: number
  id: string
  name: string
  started: boolean
}

async function* iterateOpenAIToAnthropicEvents(
  response: Response,
  streamController: AbortController,
  userSignal: AbortSignal,
  model: string,
): AsyncGenerator<BetaRawMessageStreamEvent> {
  const mergedRead = mergeAbortSignals(streamController.signal, userSignal)
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  let messageStarted = false
  const msgId = `msg_${randomUUID()}`
  let nextBlockIndex = 0
  let textBlockIndex: number | null = null
  const toolsByOpenAIIndex = new Map<number, ToolAcc>()

  const ensureMessageStart = function* (): Generator<BetaRawMessageStreamEvent> {
    if (!messageStarted) {
      yield makeMessageStart(model, msgId)
      messageStarted = true
    }
  }

  const finalizeBlocks = function* (): Generator<BetaRawMessageStreamEvent> {
    if (textBlockIndex !== null) {
      yield { type: 'content_block_stop', index: textBlockIndex }
      textBlockIndex = null
    }
    const sorted = [...toolsByOpenAIIndex.values()].sort(
      (a, b) => a.blockIndex - b.blockIndex,
    )
    for (const t of sorted) {
      if (t.started) {
        yield { type: 'content_block_stop', index: t.blockIndex }
      }
    }
    toolsByOpenAIIndex.clear()
  }

  try {
    while (!mergedRead.aborted) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '')
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') {
          yield* finalizeBlocks()
          yield {
            type: 'message_delta',
            usage: emptyDeltaUsage(),
            delta: {
              stop_reason: 'end_turn',
              stop_sequence: null,
              container: null,
            },
            context_management: null,
          }
          yield { type: 'message_stop' }
          return
        }

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(payload) as Record<string, unknown>
        } catch {
          continue
        }

        const choices = parsed.choices as
          | Array<Record<string, unknown>>
          | undefined
        const choice = choices?.[0]
        if (!choice) continue

        const delta = choice.delta as Record<string, unknown> | undefined
        const finishReason = choice.finish_reason as string | null | undefined

        if (delta?.role === 'assistant') {
          yield* ensureMessageStart()
        }

        const content = delta?.content
        if (typeof content === 'string' && content.length > 0) {
          yield* ensureMessageStart()
          if (textBlockIndex === null) {
            textBlockIndex = nextBlockIndex++
            yield {
              type: 'content_block_start',
              index: textBlockIndex,
              content_block: {
                type: 'text',
                text: '',
                citations: null,
              },
            }
          }
          yield {
            type: 'content_block_delta',
            index: textBlockIndex,
            delta: { type: 'text_delta', text: content },
          }
        }

        const toolCalls = delta?.tool_calls as
          | Array<Record<string, unknown>>
          | undefined
        if (Array.isArray(toolCalls)) {
          for (const tc of toolCalls) {
            const oi =
              typeof tc.index === 'number'
                ? tc.index
                : Number(tc.index ?? 0)
            let acc = toolsByOpenAIIndex.get(oi)
            if (!acc && typeof tc.id === 'string') {
              acc = {
                blockIndex: nextBlockIndex++,
                id: tc.id,
                name: '',
                started: false,
              }
              toolsByOpenAIIndex.set(oi, acc)
            }
            if (!acc) continue

            const fn = tc.function as Record<string, unknown> | undefined
            if (!acc.started && fn && typeof fn.name === 'string' && fn.name) {
              yield* ensureMessageStart()
              acc.name = fn.name
              yield {
                type: 'content_block_start',
                index: acc.blockIndex,
                content_block: {
                  type: 'tool_use',
                  id: acc.id,
                  name: acc.name,
                  input: '',
                },
              }
              acc.started = true
            }
            if (acc.started && fn && typeof fn.arguments === 'string' && fn.arguments) {
              yield {
                type: 'content_block_delta',
                index: acc.blockIndex,
                delta: {
                  type: 'input_json_delta',
                  partial_json: fn.arguments,
                },
              }
            }
          }
        }

        const usage = parsed.usage as
          | Record<string, number>
          | undefined
        if (finishReason != null) {
          yield* finalizeBlocks()
          const stop = mapFinishReason(finishReason)
          const du: BetaMessageDeltaUsage = {
            cache_creation_input_tokens: null,
            cache_read_input_tokens: null,
            input_tokens:
              usage && typeof usage.prompt_tokens === 'number'
                ? usage.prompt_tokens
                : null,
            iterations: null,
            output_tokens:
              usage && typeof usage.completion_tokens === 'number'
                ? usage.completion_tokens
                : 0,
            server_tool_use: null,
          }
          yield {
            type: 'message_delta',
            usage: du,
            delta: {
              stop_reason: stop,
              stop_sequence: null,
              container: null,
            },
            context_management: null,
          }
          yield { type: 'message_stop' }
          return
        }
      }
    }

    if (messageStarted) {
      yield* finalizeBlocks()
      yield {
        type: 'message_delta',
        usage: emptyDeltaUsage(),
        delta: {
          stop_reason: 'end_turn',
          stop_sequence: null,
          container: null,
        },
        context_management: null,
      }
      yield { type: 'message_stop' }
    }
  } finally {
    reader.releaseLock?.()
  }
}

export type OpenAICompatStreamResult = {
  stream: Stream<BetaRawMessageStreamEvent>
  response: Response
  requestId: string | null
}

/**
 * 发起 OpenAI 兼容流式请求，返回与 Anthropic SDK `Stream` 相同消费方式的迭代器。
 */
export async function openAICompatStreamingRequest(
  params: BetaMessageStreamParams,
  signal: AbortSignal,
  fetchOverride?: typeof fetch,
): Promise<OpenAICompatStreamResult> {
  const route = resolveOpenAICompatRouting(String(params.model))
  const bodyParams =
    route.bodyModel === params.model
      ? params
      : { ...params, model: route.bodyModel }
  const url = route.url
  const headers: Record<string, string> = {
    ...route.headers,
    'Content-Type': 'application/json',
  }
  const body = buildOpenAIChatCompletionBody(bodyParams, { stream: true })
  mergeOpenAICompatExtraBody(body)
  body.stream = true

  const fetchFn = fetchOverride ?? globalThis.fetch
  const streamController = new AbortController()
  const merged = mergeAbortSignals(signal, streamController.signal)

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

  if (!response.body) {
    throw new APIConnectionError({
      message: 'OpenAI compat: response has no body',
    })
  }

  const model = String(bodyParams.model)
  const requestId = response.headers.get('x-request-id')

  const stream = new Stream(
    () =>
      iterateOpenAIToAnthropicEvents(
        response,
        streamController,
        signal,
        model,
      ),
    streamController,
    undefined as unknown as Anthropic,
  )

  return { stream, response, requestId }
}
