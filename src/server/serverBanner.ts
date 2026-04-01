import type { ServerConfig } from './types.js'

export function printBanner(
  _config: ServerConfig,
  _authToken: string,
  _actualPort: number,
): void {
  process.stderr.write(
    'Claude Code server (stub) — listen/banner 未完整实现于本构建。\n',
  )
}
