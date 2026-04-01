export function unzipSync(_data: Uint8Array): Record<string, Uint8Array> {
  return {}
}

/** Minimal stub: returns empty ZIP bytes (real fflate produces a valid archive). */
export function zipSync(
  _files: Record<string, unknown>,
  _opts?: { level?: number },
): Uint8Array {
  return new Uint8Array(0)
}
