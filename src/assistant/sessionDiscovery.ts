export type AssistantDiscoveredSession = {
  id: string
  label?: string
}

/**
 * 列举可连接的远程 assistant 会话。本构建返回空列表（完整实现依赖内部桥接）。
 */
export async function discoverAssistantSessions(): Promise<
  AssistantDiscoveredSession[]
> {
  return []
}
