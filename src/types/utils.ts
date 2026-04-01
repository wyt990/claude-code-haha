/** Recursive readonly (stub). */
export type DeepImmutable<T> = T extends (...args: infer A) => infer R
  ? (...args: { [K in keyof A]: DeepImmutable<A[K]> }) => DeepImmutable<R>
  : T extends object
    ? { readonly [K in keyof T]: DeepImmutable<T[K]> }
    : T

/** Permutations of a union (stub — used for queue typing). */
export type Permutations<T extends string> = T
