import type { Message } from '../../types/message.js'

/**
 * Ant-only frustration / transcript-sharing survey (GrowthBook + O(n) memos).
 * Open builds expose this stub so conditional `require()` types resolve; the
 * hook is always inactive here.
 */
export function useFrustrationDetection(
  _messages?: Message[],
  _isLoading?: boolean,
  _hasActivePrompt?: boolean,
  _otherSurveysOpen?: boolean,
): {
  state: 'closed'
  handleTranscriptSelect: () => void
} {
  return {
    state: 'closed',
    handleTranscriptSelect: () => {},
  }
}
