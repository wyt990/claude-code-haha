/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TaskStateBase, TaskStatus } from '../../Task.js'

export interface MonitorMcpTaskState extends TaskStateBase {
  type: 'monitor_mcp'
  status: TaskStatus
  createdAt: number
}

export function killMonitorMcp(_taskId: string, _setAppState?: any): Promise<void> {
  return Promise.resolve()
}

export function killMonitorMcpTasksForAgent(_agentId: string, _getAppState?: any, _setAppState?: any): Promise<void> {
  return Promise.resolve()
}
