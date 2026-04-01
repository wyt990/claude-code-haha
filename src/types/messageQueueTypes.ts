/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SessionId } from './ids.js'

export type QueueOperation = 'enqueue' | 'dequeue' | 'remove' | 'popAll'

export type QueueOperationMessage = {
  type: 'queue-operation'
  operation: QueueOperation
  timestamp: string
  sessionId: SessionId
  content?: string
}

export type QueuedMessage = any
