import type { Message } from '../types/message.js'

/**
 * Buddy / companion reaction observer (bundle-specific). No-op in open builds.
 */
export function fireCompanionObserver(
  _messages: Message[],
  _onReaction: (reaction: string) => void,
): void {}
