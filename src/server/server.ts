import type { SessionManager } from './sessionManager.js'
import type { ServerConfig } from './types.js'

export type StartedServer = {
  port?: number
  stop: (graceful?: boolean) => void
}

/**
 * 启动会话服务器。本仓库为占位实现：`claude server` 会抛出明确错误。
 */
export function startServer(
  _config: ServerConfig,
  _sessionManager: SessionManager,
  _logger: unknown,
): StartedServer {
  throw new Error(
    '`claude server` 子命令在本构建中尚未实现。若需多会话 HTTP 服务，请参考上游 Claude Code 或自行实现 server.ts。',
  )
}
