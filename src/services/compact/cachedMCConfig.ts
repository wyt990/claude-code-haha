/** Shape read by prompts / microcompact; stub returns empty object. */
export type CachedMCConfig = {
  enabled?: boolean
  supportedModels?: string[]
  systemPromptSuggestSummaries?: boolean
  keepRecent?: number
}

export function getCachedMCConfig(): CachedMCConfig {
  return {}
}
