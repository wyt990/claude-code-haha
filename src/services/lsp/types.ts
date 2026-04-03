/* eslint-disable @typescript-eslint/no-explicit-any */
export type ScopedLspServerConfig = Record<string, any>
export type LspServerConfig = Record<string, any>
export type LspServerState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error'
