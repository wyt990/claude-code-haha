import type { Message } from '../types/message.js'

export type SessionTurnUploader = (messages: Message[]) => void

/**
 * 按 turn 上传会话环境元数据（Anthropic 内部用）。本构建返回 no-op。
 */
export function createSessionTurnUploader(): SessionTurnUploader {
  return () => {}
}
