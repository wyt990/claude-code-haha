/**
 * 合并提示构建（Agent 内存快照升级流程）。完整 UI 未随本仓库提供时仍须导出供 main 动态导入。
 */
export function buildMergePrompt(agentType: string, _memory: unknown): string {
  return `请根据最新快照合并 agent「${agentType}」的内存说明（快照合并向导为简化存根）。`
}
