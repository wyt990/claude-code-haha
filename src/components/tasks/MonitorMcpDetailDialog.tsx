/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react'

interface MonitorMcpDetailDialogProps {
  task: any
  onClose?: () => void
  onKill?: () => Promise<void>
  onBack?: () => void
  key?: string
  [key: string]: any
}

export function MonitorMcpDetailDialog(_props: MonitorMcpDetailDialogProps): React.ReactNode {
  return null
}
