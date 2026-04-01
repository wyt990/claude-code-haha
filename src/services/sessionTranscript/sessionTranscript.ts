/**
 * KAIROS / session transcript hook. No-op in trees without full transcript sink.
 */
export function writeSessionTranscriptSegment(_messages: unknown[]): void {
  // Intentionally empty — real implementation ships with KAIROS builds.
}
