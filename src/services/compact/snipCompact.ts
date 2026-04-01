export function isSnipMarkerMessage(_message: unknown): boolean {
  return false
}

export async function snipCompactIfNeeded(
  store: unknown,
  _opts: { force: boolean },
): Promise<unknown> {
  return store
}
