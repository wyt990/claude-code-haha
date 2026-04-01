// Stub for ant-only cache-editing microcompact (module missing from tree).
export type CacheEditsBlock = Record<string, unknown>

export type PinnedCacheEdits = {
  userMessageIndex: number
  block: CacheEditsBlock
}

export type CachedMCState = {
  pinnedEdits: PinnedCacheEdits[]
  registeredTools: Set<string>
}

export function createCachedMCState(): CachedMCState {
  return { pinnedEdits: [], registeredTools: new Set() }
}

export function isCachedMicrocompactEnabled(): boolean {
  return false
}

export function isModelSupportedForCacheEditing(_model: string): boolean {
  return false
}

export function getCachedMCConfig(): Record<string, unknown> {
  return {}
}

export function registerToolResult(_state: CachedMCState, _toolUseId: string): void {}

export function registerToolMessage(
  _state: CachedMCState,
  _groupIds: string[],
): void {}

export function getToolResultsToDelete(_state: CachedMCState): string[] {
  return []
}

export function createCacheEditsBlock(
  _state: CachedMCState,
  _toolUseIds: string[],
): CacheEditsBlock | null {
  return null
}

export function markToolsSentToAPI(_state: CachedMCState): void {}

export function resetCachedMCState(state: CachedMCState): void {
  state.pinnedEdits = []
  state.registeredTools.clear()
}
