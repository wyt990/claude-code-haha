/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskStateBase, TaskStatus } from '../../Task.js'

export interface LocalWorkflowTaskState extends TaskStateBase {
  type: 'local_workflow'
  status: TaskStatus
  prompt?: string
  createdAt: number
  summary?: string
}

export function killWorkflowTask(_taskId: string, _setAppState?: any): Promise<void> {
  return Promise.resolve()
}

export function skipWorkflowAgent(_taskId: string, _agentId: string, _setAppState?: any): Promise<void> {
  return Promise.resolve()
}

export function retryWorkflowAgent(_taskId: string, _agentId: string, _setAppState?: any): Promise<void> {
  return Promise.resolve()
}
