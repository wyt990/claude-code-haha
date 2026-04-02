import hljs from 'highlight.js'

/**
 * Path-mapped stub for `cli-highlight` (see tsconfig). Real package is not
 * bundled; we still need API parity so markdown / Fallback callers do not crash
 * on missing `supportsLanguage`.
 */
export function supportsLanguage(lang: string): boolean {
  const t = typeof lang === 'string' ? lang.trim() : ''
  if (!t) return false
  return Boolean(hljs.getLanguage(t))
}

/**
 * No ANSI theming without the real cli-highlight; return source so code blocks
 * stay visible (empty string would wipe fenced code in the UI).
 */
export function highlight(code: string, _opts?: { language?: string }): string {
  return code
}
