import type { Message } from '../../types/message.js'

export type ContextCollapseStats = {
  collapsedSpans: number
  stagedSpans: number
  collapsedMessages: number
  health: {
    totalSpawns: number
    totalErrors: number
    totalEmptySpawns: number
    emptySpawnWarningEmitted: boolean
    /** Set when a spawn fails; optional in stubs / minimal stats. */
    lastError?: string
  }
}

const listeners = new Set<() => void>()

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getStats(): ContextCollapseStats {
  return {
    collapsedSpans: 0,
    stagedSpans: 0,
    collapsedMessages: 0,
    health: {
      totalSpawns: 0,
      totalErrors: 0,
      totalEmptySpawns: 0,
      emptySpawnWarningEmitted: false,
    },
  }
}

export function isContextCollapseEnabled(): boolean {
  return false
}

/** Clears staged collapse state after transcript rewind. No-op when disabled. */
export function resetContextCollapse(): void {}

/** Registers collapse workers / hooks in full builds; no-op here. */
export function initContextCollapse(): void {}

export async function applyCollapsesIfNeeded(
  messages: Message[],
  _toolUseContext: unknown,
  _querySource: unknown,
): Promise<{ messages: Message[] }> {
  return { messages }
}

export function isWithheldPromptTooLong(
  _message: unknown,
  _isPromptTooLong: (m: unknown) => boolean,
  _querySource: unknown,
): boolean {
  return false
}

export function recoverFromOverflow(
  messages: Message[],
  _querySource: unknown,
): { messages: Message[]; committed: number } {
  return { messages, committed: 0 }
}
