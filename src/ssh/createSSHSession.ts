import type { SSHSessionManager, SSHSessionManagerHooks } from './SSHSessionManager.js'

export class SSHSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SSHSessionError'
  }
}

/**
 * SSH remote session handle. Open-source tree does not ship the ssh binary
 * plumbing; `createSSHSession` / `createLocalSSHSession` throw
 * {@link SSHSessionError} when `SSH_REMOTE` is enabled without a full build.
 */
export type SSHSession = {
  remoteCwd: string
  createManager: (hooks: SSHSessionManagerHooks) => SSHSessionManager
  getStderrTail: () => string
  proc: { exitCode: number | null; signalCode: NodeJS.Signals | null }
  proxy: { stop: () => void }
}

export async function createSSHSession(
  _opts: {
    host: string
    cwd: string
    localVersion: string
    permissionMode: string
    dangerouslySkipPermissions?: boolean
    extraCliArgs?: string[]
  },
  _progress?: { onProgress?: (msg: string) => void },
): Promise<SSHSession> {
  throw new SSHSessionError(
    '此构建未包含 `claude ssh` 远程会话实现。请使用带 SSH 支持的发行版，或勿启用 SSH_REMOTE。',
  )
}

export function createLocalSSHSession(_opts: {
  cwd: string
  permissionMode: string
  dangerouslySkipPermissions?: boolean
}): SSHSession {
  throw new SSHSessionError(
    '此构建未包含本地 SSH 代理测试会话。请使用完整构建或关闭 SSH_REMOTE。',
  )
}
