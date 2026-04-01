import type { LogOption } from '../types/logs.js'

/**
 * 从内部分享链接解析 ccshare id。本构建未接入内部 URL 解析，恒为 null。
 */
export function parseCcshareId(_resumeArg: string): string | null {
  return null
}

/**
 * 按 ccshare id 加载会话日志。未实现时勿调用（main 仅在 parseCcshareId 非空时调用）。
 */
export async function loadCcshare(_id: string): Promise<LogOption> {
  throw new Error(
    'ccshare resume is not available in this build (parseCcshareId returned a value unexpectedly).',
  )
}
