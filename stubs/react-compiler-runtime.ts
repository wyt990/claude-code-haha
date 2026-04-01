/**
 * Minimal React Compiler memo-cache runtime for pre-compiled components.
 * Open-source tree does not ship `react/compiler-runtime`; this stub matches
 * the array + sentinel pattern the compiler emits.
 */
const MEMO_CACHE_SENTINEL = Symbol.for('react.memo_cache_sentinel')

export function c(size: number): unknown[] {
  return Array.from({ length: size }, () => MEMO_CACHE_SENTINEL)
}
