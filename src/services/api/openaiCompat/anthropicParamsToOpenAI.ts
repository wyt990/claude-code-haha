import type {
  BetaContentBlockParam,
  BetaMessageParam,
  BetaMessageStreamParams,
  BetaToolUnion,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'

type OpenAIChatMessage = Record<string, unknown>

/** 含 PDF/文档块时 OpenAI Chat Completions 无法承载，提前失败并提示用户。 */
export function assertOpenAICompatMessagesSupported(
  params: BetaMessageStreamParams,
): void {
  for (const m of params.messages) {
    if (typeof m.content === 'string') continue
    for (const block of m.content) {
      const t = (block as { type?: string }).type
      if (t === 'document') {
        throw new Error(
          '[OpenAI 兼容] 对话包含 PDF/文档块 (document)，当前路径不支持。请关闭 CLAUDE_CODE_USE_OPENAI_COMPAT_API 或移除文档附件。',
        )
      }
    }
  }
}

function skipAssistantBlock(block: BetaContentBlockParam): boolean {
  const t = block.type
  return (
    t === 'thinking' ||
    t === 'redacted_thinking' ||
    t === 'server_tool_use' ||
    t === 'mcp_tool_use'
  )
}

function skipUserBlock(block: BetaContentBlockParam): boolean {
  const t = block.type
  return t === 'thinking' || t === 'redacted_thinking'
}

function extractSystem(system: BetaMessageStreamParams['system']): string | undefined {
  if (system === undefined || system === null) return undefined
  if (typeof system === 'string') return system
  if (!Array.isArray(system)) return String(system)
  const parts: string[] = []
  for (const block of system) {
    if (typeof block === 'object' && block && 'type' in block) {
      if (block.type === 'text' && 'text' in block && typeof block.text === 'string') {
        parts.push(block.text)
      }
    }
  }
  const s = parts.join('\n').trim()
  return s.length > 0 ? s : undefined
}

function toolResultToOpenAIToolMessage(
  block: BetaContentBlockParam & { type: 'tool_result' },
): OpenAIChatMessage {
  const content =
    typeof block.content === 'string'
      ? block.content
      : JSON.stringify(block.content ?? '')
  return {
    role: 'tool',
    tool_call_id: block.tool_use_id,
    content,
  }
}

function userBlocksToOpenAI(
  blocks: BetaContentBlockParam[],
): OpenAIChatMessage[] {
  const out: OpenAIChatMessage[] = []
  const userParts: unknown[] = []

  for (const block of blocks) {
    if (skipUserBlock(block)) {
      continue
    }
    if (block.type === 'text') {
      userParts.push({ type: 'text', text: block.text })
    } else if (block.type === 'tool_result') {
      if (userParts.length > 0) {
        out.push({
          role: 'user',
          content:
            userParts.length === 1 &&
            typeof userParts[0] === 'object' &&
            userParts[0] !== null &&
            (userParts[0] as { type?: string }).type === 'text'
              ? (userParts[0] as { text: string }).text
              : userParts,
        })
        userParts.length = 0
      }
      out.push(toolResultToOpenAIToolMessage(block))
    } else if (block.type === 'image') {
      const src = block.source
      if (src && typeof src === 'object' && 'type' in src) {
        if (src.type === 'base64' && 'data' in src && 'media_type' in src) {
          userParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${(src as { media_type: string }).media_type};base64,${(src as { data: string }).data}`,
            },
          })
        } else if (src.type === 'url' && 'url' in src) {
          userParts.push({
            type: 'image_url',
            image_url: { url: String((src as { url: string }).url) },
          })
        }
      }
    }
    // document 在 assertOpenAICompatMessagesSupported 已拦截；其余未知块跳过
  }

  if (userParts.length > 0) {
    out.push({
      role: 'user',
      content:
        userParts.length === 1 &&
        typeof userParts[0] === 'object' &&
        userParts[0] !== null &&
        (userParts[0] as { type?: string }).type === 'text'
          ? (userParts[0] as { text: string }).text
          : userParts,
    })
  }

  return out
}

function assistantBlocksToOpenAI(
  blocks: BetaContentBlockParam[],
): OpenAIChatMessage {
  let text = ''
  const toolCalls: unknown[] = []
  for (const block of blocks) {
    if (skipAssistantBlock(block)) {
      continue
    }
    if (block.type === 'text') {
      text += block.text
    } else if (block.type === 'tool_use') {
      const args =
        typeof block.input === 'string'
          ? block.input
          : JSON.stringify(block.input ?? {})
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: args,
        },
      })
    }
  }
  const hasTools = toolCalls.length > 0
  return {
    role: 'assistant',
    content: text.length > 0 ? text : hasTools ? null : '',
    ...(hasTools ? { tool_calls: toolCalls } : {}),
  }
}

function convertMessages(messages: BetaMessageParam[]): OpenAIChatMessage[] {
  const out: OpenAIChatMessage[] = []
  for (const m of messages) {
    if (m.role === 'user') {
      if (typeof m.content === 'string') {
        out.push({ role: 'user', content: m.content })
      } else {
        out.push(...userBlocksToOpenAI(m.content))
      }
    } else {
      if (typeof m.content === 'string') {
        out.push({ role: 'assistant', content: m.content })
      } else {
        out.push(assistantBlocksToOpenAI(m.content))
      }
    }
  }
  return out
}

function anthropicToolToOpenAI(tool: BetaToolUnion): Record<string, unknown> | null {
  if (!tool || typeof tool !== 'object') return null
  const t = tool as unknown as Record<string, unknown>
  const name = t.name
  if (typeof name !== 'string') return null
  const toolType = typeof t.type === 'string' ? t.type : ''
  if (
    toolType.includes('tool_search') ||
    toolType.includes('web_search_tool') ||
    toolType.includes('code_execution') ||
    toolType === 'mcp_toolset'
  ) {
    return null
  }
  const inputSchema = t.input_schema
  return {
    type: 'function',
    function: {
      name,
      description: typeof t.description === 'string' ? t.description : undefined,
      parameters:
        inputSchema && typeof inputSchema === 'object'
          ? inputSchema
          : { type: 'object', properties: {} },
    },
  }
}

function convertToolChoice(
  toolChoice: BetaMessageStreamParams['tool_choice'],
): unknown {
  if (toolChoice === undefined || toolChoice === null) return 'auto'
  if (typeof toolChoice === 'string') return toolChoice
  if (typeof toolChoice === 'object' && toolChoice !== null && 'type' in toolChoice) {
    const tc = toolChoice as { type: string; name?: string }
    if (tc.type === 'auto') return 'auto'
    if (tc.type === 'any') return 'required'
    if (tc.type === 'tool' && typeof tc.name === 'string') {
      return { type: 'function', function: { name: tc.name } }
    }
    if (tc.type === 'none') return 'none'
  }
  return 'auto'
}

/**
 * 将 `queryModel` 产出的 Beta 请求参数转为 OpenAI `chat/completions` JSON 体（子集）。
 */
export function buildOpenAIChatCompletionBody(
  params: BetaMessageStreamParams,
  options: { stream?: boolean } = {},
): Record<string, unknown> {
  assertOpenAICompatMessagesSupported(params)
  const stream = options.stream !== false

  const system = extractSystem(params.system)
  const messages: OpenAIChatMessage[] = []
  if (system) {
    messages.push({ role: 'system', content: system })
  }
  messages.push(...convertMessages(params.messages))

  const body: Record<string, unknown> = {
    model: params.model,
    messages,
    stream,
    max_tokens: params.max_tokens,
  }

  if (params.temperature !== undefined) {
    body.temperature = params.temperature
  }

  if (Array.isArray(params.tools) && params.tools.length > 0) {
    const tools = params.tools
      .map(t => anthropicToolToOpenAI(t))
      .filter((x): x is Record<string, unknown> => x !== null)
    if (tools.length > 0) {
      body.tools = tools
      body.tool_choice = convertToolChoice(params.tool_choice)
    }
  }

  return body
}
