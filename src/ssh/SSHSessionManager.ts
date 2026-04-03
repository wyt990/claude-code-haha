import type { RemoteMessageContent } from '../utils/teleport/api.js'

export interface SSHPermissionRequest {
  tool_name: string
  description?: string
  permission_suggestions?: string[]
  blocked_path?: string
  input?: Record<string, unknown>
  tool_use_id: string
}

/** Hooks passed to {@link SSHSession.createManager}. */
export type SSHSessionManagerHooks = {
  onMessage: (msg: unknown) => void
  onPermissionRequest: (request: SSHPermissionRequest, requestId: string) => void
  onConnected: () => void
  onReconnecting: (attempt: number, max: number) => void
  onDisconnected: () => void
  onError: (error: Error) => void
}

/**
 * Manages the SSH child ↔ SDK message bridge. Real implementation lives in
 * full builds; this type is shared with `useSSHSession`.
 */
export type SSHSessionManager = {
  connect: () => void
  disconnect: () => void
  sendMessage: (content: RemoteMessageContent) => Promise<boolean>
  sendInterrupt: () => void
  respondToPermissionRequest: (
    requestId: string,
    response: unknown,
  ) => void
}
