import type { RemoteMessageContent } from '../utils/teleport/api.js'

/** Hooks passed to {@link SSHSession.createManager}. */
export type SSHSessionManagerHooks = {
  onMessage: (msg: unknown) => void
  onPermissionRequest: (request: unknown, requestId: string) => void
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
