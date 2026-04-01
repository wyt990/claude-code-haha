import { logForDebugging } from 'src/utils/debug.js'

/**
 * 将 `CLAUDE_CODE_OPENAI_EXTRA_BODY`（JSON 对象）合并进 Chat Completions 请求体。
 * 不会覆盖 `model`、`messages`、`stream`（由调用方在合并后强制写入）。
 */
export function mergeOpenAICompatExtraBody(body: Record<string, unknown>): void {
  const raw = process.env.CLAUDE_CODE_OPENAI_EXTRA_BODY?.trim()
  if (!raw) return
  try {
    const extra = JSON.parse(raw) as unknown
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
      return
    }
    const skip = new Set(['model', 'messages', 'stream'])
    for (const [k, v] of Object.entries(extra as Record<string, unknown>)) {
      if (skip.has(k)) continue
      body[k] = v
    }
  } catch (e) {
    logForDebugging(
      `[openaiCompat] CLAUDE_CODE_OPENAI_EXTRA_BODY JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`,
      { level: 'warn' },
    )
  }
}
