import { isEnvTruthy } from './envUtils.js'

/**
 * Strips a trailing `/v1` path segment (OpenAI-style gateway docs often show
 * base URLs ending in `/v1`). The Anthropic SDK always requests `/v1/messages`
 * relative to baseURL, so `https://host/v1` would become `https://host/v1/v1/messages`.
 */
export function stripTrailingV1ForAnthropicSdk(url: string): string {
  const trimmed = url.trim()
  const noTrailingSlashes = trimmed.replace(/\/+$/, '')
  if (noTrailingSlashes.toLowerCase().endsWith('/v1')) {
    return noTrailingSlashes.slice(0, -3)
  }
  return trimmed
}

/**
 * When `CLAUDE_CODE_OPENAI_COMPATIBLE_API` is enabled, rewrite
 * `process.env.ANTHROPIC_BASE_URL` once at startup (preload) so all Anthropic
 * SDK and HTTP clients see a single canonical base. Does not change protocol:
 * requests remain Anthropic Messages API (`/v1/messages`).
 */
export function applyAnthropicBaseUrlEnvNormalization(): void {
  const raw = process.env.ANTHROPIC_BASE_URL
  if (!raw?.trim()) return
  if (!isEnvTruthy(process.env.CLAUDE_CODE_OPENAI_COMPATIBLE_API)) return

  const next = stripTrailingV1ForAnthropicSdk(raw)
  if (next !== raw) {
    process.env.ANTHROPIC_BASE_URL = next
  }
}
