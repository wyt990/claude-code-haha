/* eslint-disable @typescript-eslint/no-explicit-any */
export type CuPermissionRequest = Record<string, any>
export type CuPermissionResponse = {
  granted: unknown[]
  denied: unknown[]
  flags: unknown
}

export const DEFAULT_GRANT_FLAGS = {}
