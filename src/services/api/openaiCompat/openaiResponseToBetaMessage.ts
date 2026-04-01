import type {
  BetaContentBlock,
  BetaMessage,
  BetaStopReason,
  BetaUsage,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { randomUUID } from 'crypto'

function mapOpenAIFinishToStopReason(fr: string | null | undefined): BetaStopReason {
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

function usageFromOpenAI(u: unknown): BetaUsage {
  const empty: BetaUsage = {
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
  if (!u || typeof u !== 'object') return empty
  const o = u as Record<string, unknown>
  const pt = o.prompt_tokens
  const ct = o.completion_tokens
  return {
    ...empty,
    input_tokens: typeof pt === 'number' ? pt : 0,
    output_tokens: typeof ct === 'number' ? ct : 0,
  }
}

/**
 * 将 OpenAI `POST /v1/chat/completions`（stream:false）的 JSON 转为 `BetaMessage`。
 */
export function openAICompletionJsonToBetaMessage(
  json: Record<string, unknown>,
  model: string,
): BetaMessage {
  const choices = json.choices as Array<Record<string, unknown>> | undefined
  const choice = choices?.[0]
  const msg = (choice?.message ?? {}) as Record<string, unknown>
  const contentBlocks: BetaContentBlock[] = []

  if (typeof msg.content === 'string' && msg.content.length > 0) {
    contentBlocks.push({
      type: 'text',
      text: msg.content,
      citations: null,
    })
  }

  const toolCalls = msg.tool_calls as Array<Record<string, unknown>> | undefined
  if (Array.isArray(toolCalls)) {
    for (const tc of toolCalls) {
      const fn = tc.function as Record<string, unknown> | undefined
      const name =
        typeof fn?.name === 'string' && fn.name ? fn.name : 'unknown_tool'
      const argsStr =
        typeof fn?.arguments === 'string' ? fn.arguments : '{}'
      let input: unknown = {}
      try {
        input = JSON.parse(argsStr || '{}') as unknown
      } catch {
        input = {}
      }
      contentBlocks.push({
        type: 'tool_use',
        id: typeof tc.id === 'string' ? tc.id : `toolu_${randomUUID()}`,
        name,
        input,
      })
    }
  }

  if (contentBlocks.length === 0) {
    contentBlocks.push({ type: 'text', text: '', citations: null })
  }

  const finishReason = choice?.finish_reason as string | null | undefined
  const id =
    typeof json.id === 'string' && json.id.length > 0
      ? json.id
      : `msg_${randomUUID()}`

  return {
    id,
    container: null,
    content: contentBlocks,
    context_management: null,
    model,
    role: 'assistant',
    stop_reason: mapOpenAIFinishToStopReason(finishReason),
    stop_sequence: null,
    type: 'message',
    usage: usageFromOpenAI(json.usage),
  }
}
