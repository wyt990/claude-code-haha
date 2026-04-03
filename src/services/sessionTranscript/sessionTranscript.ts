/**
 * KAIROS / session transcript hook. No-op in trees without full transcript sink.
 */
export function writeSessionTranscriptSegment(_messages: unknown[]): void {
  // Intentionally empty — real implementation ships with KAIROS builds.
}

/**
 * Flush prior-day transcript buckets when the session date rolls over (/dream etc.).
 * No-op in minimal builds.
 */
export function flushOnDateChange(
  _messages: unknown[],
  _currentDate: string,
): void {
  // Intentionally empty — real implementation ships with KAIROS builds.
}
