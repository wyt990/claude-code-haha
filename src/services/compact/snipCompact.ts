export function isSnipMarkerMessage(_message: unknown): boolean {
  return false
}

export async function snipCompactIfNeeded(
  store: unknown,
  _opts: { force: boolean },
): Promise<unknown> {
  return store
}

/** Matches SnipTool gating — false in trees without snip runtime. */
export function isSnipRuntimeEnabled(): boolean {
  return false
}

/** Pacing for context_efficiency attachment; false keeps nudges off in stub builds. */
export function shouldNudgeForSnips(_messages: unknown[]): boolean {
  return false
}

export const SNIP_NUDGE_TEXT = ''
