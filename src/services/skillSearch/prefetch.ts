import type { Message } from '../../types/message.js'
import type { ToolUseContext } from '../../Tool.js'
import type { DiscoverySignal } from './signals.js'

export type SkillDiscoveryAttachment = {
  type: 'skill_discovery'
  skills: { name: string; description: string; shortId?: string }[]
  signal: DiscoverySignal
  source: 'native' | 'aki' | 'both'
}

type AttachmentContext = ToolUseContext & { abortController: AbortController }

/** Opaque handle from startSkillDiscoveryPrefetch; stub never returns a real handle. */
export type SkillDiscoveryPrefetchHandle = { _tag: 'skillDiscoveryPrefetch' }

/**
 * Turn-0 skill discovery from user input. Full AKI/search ships in upstream;
 * local stub returns no attachments so EXPERIMENTAL_SKILL_SEARCH can typecheck.
 */
export async function getTurnZeroSkillDiscovery(
  _input: string,
  _messages: Message[],
  _context: AttachmentContext,
): Promise<SkillDiscoveryAttachment[]> {
  return []
}

/**
 * Inter-turn discovery (runs under write-pivot guard). Stub: no background work.
 */
export function startSkillDiscoveryPrefetch(
  _input: string | null,
  _messages: Message[],
  _toolUseContext: ToolUseContext,
): SkillDiscoveryPrefetchHandle | null {
  return null
}

export async function collectSkillDiscoveryPrefetch(
  _pending: SkillDiscoveryPrefetchHandle,
): Promise<SkillDiscoveryAttachment[]> {
  return []
}

/** Runtime shape of `require('.../prefetch.js')` — use for casts next to require(). */
export type SkillSearchPrefetchModule = {
  getTurnZeroSkillDiscovery: typeof getTurnZeroSkillDiscovery
  startSkillDiscoveryPrefetch: typeof startSkillDiscoveryPrefetch
  collectSkillDiscoveryPrefetch: typeof collectSkillDiscoveryPrefetch
}
