import type { DirectConnectConfig } from './directConnectManager.js'

/**
 * 通过直连配置运行 headless 一轮。完整实现需接 WebSocket 与 print 管线；此处占位便于类型检查。
 */
export async function runConnectHeadless(
  _config: DirectConnectConfig,
  _prompt: string,
  _outputFormat: string,
  _interactive: boolean,
): Promise<void> {
  throw new Error(
    '`claude open` headless（-p）直连模式在本构建中尚未实现。请使用交互式 cc:// 启动，或自行补全 connectHeadless。',
  )
}
