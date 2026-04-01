import { isEnvTruthy } from 'src/utils/envUtils.js'

/** 启用 OpenAI Chat Completions 兼容分支（与 Anthropic Messages 互斥于同一请求内）。 */
export function isOpenAICompatApiMode(): boolean {
  return isEnvTruthy(process.env.CLAUDE_CODE_USE_OPENAI_COMPAT_API)
}

/**
 * OpenAI 网关根地址。
 * 优先 `CLAUDE_CODE_OPENAI_BASE_URL`，否则 `ANTHROPIC_BASE_URL`，否则报错（由调用方处理）。
 */
export function getOpenAIBaseUrlRaw(): string {
  const raw =
    process.env.CLAUDE_CODE_OPENAI_BASE_URL?.trim() ||
    process.env.ANTHROPIC_BASE_URL?.trim()
  if (!raw) {
    throw new Error(
      'OpenAI 兼容模式需要设置 CLAUDE_CODE_OPENAI_BASE_URL 或 ANTHROPIC_BASE_URL',
    )
  }
  return raw.replace(/\/+$/, '')
}

/**
 * `POST .../v1/chat/completions` 的完整 URL。
 * - 若 base 以 `/v1` 结尾：`${base}/chat/completions`
 * - 否则：`${base}/v1/chat/completions`
 */
export function getOpenAIChatCompletionsUrl(): string {
  const base = getOpenAIBaseUrlRaw()
  const withV1 = base.toLowerCase().endsWith('/v1') ? base : `${base}/v1`
  return `${withV1}/chat/completions`
}

/** Authorization / x-api-key，与 Anthropic 客户端惯例一致。 */
export function getOpenAIAuthHeaders(): Record<string, string> {
  if (process.env.ANTHROPIC_AUTH_TOKEN?.trim()) {
    return {
      Authorization: `Bearer ${process.env.ANTHROPIC_AUTH_TOKEN.trim()}`,
    }
  }
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return { 'x-api-key': process.env.ANTHROPIC_API_KEY.trim() }
  }
  throw new Error(
    'OpenAI 兼容模式需要 ANTHROPIC_AUTH_TOKEN 或 ANTHROPIC_API_KEY',
  )
}

export function mergeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b])
  }
  const c = new AbortController()
  const abort = () => {
    c.abort()
  }
  if (a.aborted || b.aborted) {
    c.abort()
    return c.signal
  }
  a.addEventListener('abort', abort)
  b.addEventListener('abort', abort)
  return c.signal
}
