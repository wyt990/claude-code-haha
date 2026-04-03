/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react'

interface WorkflowDetailDialogProps {
  workflow: any
  onClose?: () => void
  onDone?: (result?: string, options?: any) => void
  onKill?: () => Promise<void>
  onSkipAgent?: (agentId: string) => Promise<void>
  onRetryAgent?: (agentId: string, reason?: string) => Promise<void>
  onBack?: () => void
  key?: string
  [key: string]: any
}

export function WorkflowDetailDialog(_props: WorkflowDetailDialogProps): React.ReactNode {
  return null
}
