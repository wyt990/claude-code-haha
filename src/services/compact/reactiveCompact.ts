/** Loosely matches `CompactionResult` from `./compact.js` (avoid circular import). */
type CompactionResultStub = {
  boundaryMarker?: unknown
  summaryMessages?: unknown
  attachments?: unknown
  hookResults?: unknown
  messagesToKeep?: unknown
  userDisplayMessage?: string
  preCompactTokenCount?: number
  postCompactTokenCount?: number
  truePostCompactTokenCount?: number
  compactionUsage?: unknown
}

export function isReactiveOnlyMode(): boolean {
  return false
}

export function isReactiveCompactEnabled(): boolean {
  return false
}

export function isWithheldPromptTooLong(_message: unknown): boolean {
  return false
}

export function isWithheldMediaSizeError(_message: unknown): boolean {
  return false
}

export async function tryReactiveCompact(_opts: unknown): Promise<null> {
  return null
}

export async function reactiveCompactOnPromptTooLong(
  _messages: unknown,
  _cacheParams: unknown,
  _opts: unknown,
): Promise<
  | { ok: true; result: CompactionResultStub }
  | { ok: false; reason: string }
> {
  return { ok: false, reason: 'error' }
}
