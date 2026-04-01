import type { UUID } from 'crypto'
import * as React from 'react'
import { useCallback } from 'react'
import { CCR_TERMS_URL } from '../../commands/ultraplan.js'
import { Box, Text } from '../../ink.js'
import type { AppState } from '../../state/AppStateStore.js'
import { useAppState, useSetAppState } from '../../state/AppState.js'
import type { RemoteAgentTaskState } from '../../tasks/RemoteAgentTask/RemoteAgentTask.js'
import type { Message } from '../../types/message.js'
import type { FileStateCache } from '../../utils/fileStateCache.js'
import { logForDebugging } from '../../utils/debug.js'
import { createUserMessage } from '../../utils/messages.js'
import { updateTaskState } from '../../utils/task/framework.js'
import { archiveRemoteSession } from '../../utils/teleport.js'
import { Select } from '../CustomSelect/select.js'
import { Dialog } from '../design-system/Dialog.js'

export type UltraplanChoiceDialogProps = {
  plan: string
  sessionId: string
  taskId: string
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  readFileState: FileStateCache
  getAppState: () => AppState
  setConversationId: React.Dispatch<React.SetStateAction<UUID>>
}

/**
 * Shown after the user chooses “execute in terminal” in CCR: import the approved
 * plan into the local transcript and tear down the remote session.
 */
export function UltraplanChoiceDialog({
  plan,
  sessionId,
  taskId,
  setMessages,
  readFileState: _readFileState,
  getAppState: _getAppState,
  setConversationId: _setConversationId,
}: UltraplanChoiceDialogProps): React.ReactNode {
  const setAppState = useSetAppState()

  const finishCleanup = useCallback(() => {
    void archiveRemoteSession(sessionId).catch(err =>
      logForDebugging(`ultraplan choice: archive failed ${String(err)}`),
    )
    setAppState(prev =>
      prev.ultraplanPendingChoice || prev.ultraplanSessionUrl
        ? {
            ...prev,
            ultraplanPendingChoice: undefined,
            ultraplanSessionUrl: undefined,
          }
        : prev,
    )
  }, [sessionId, setAppState])

  const handleSelect = useCallback(
    (value: 'import' | 'dismiss') => {
      if (value === 'import') {
        setMessages(prev => [
          ...prev,
          createUserMessage({
            content: `## Ultraplan（已从网页传回）\n\n${plan}`,
          }),
        ])
        updateTaskState<RemoteAgentTaskState>(taskId, setAppState, t =>
          t.status !== 'running'
            ? t
            : { ...t, status: 'completed', endTime: Date.now() },
        )
      } else {
        updateTaskState<RemoteAgentTaskState>(taskId, setAppState, t =>
          t.status !== 'running'
            ? t
            : { ...t, status: 'failed', endTime: Date.now() },
        )
      }
      finishCleanup()
    },
    [finishCleanup, plan, setAppState, setMessages, taskId],
  )

  const preview =
    plan.length > 2800 ? `${plan.slice(0, 2800)}\n\n…` : plan

  return (
    <Dialog
      title="Ultraplan"
      subtitle="计划已从网页版传回，可导入到本会话或关闭。"
      onCancel={() => handleSelect('dismiss')}
      hideInputGuide
    >
      <Box flexDirection="column" gap={1}>
        <Text dimColor>{preview}</Text>
        <Select
          options={[
            { label: '导入计划到当前会话', value: 'import' as const },
            { label: '关闭（不导入）', value: 'dismiss' as const },
          ]}
          onChange={v => handleSelect(v)}
          onCancel={() => handleSelect('dismiss')}
        />
      </Box>
    </Dialog>
  )
}

export type UltraplanLaunchDialogProps = {
  onChoice: (
    choice: 'cancel' | 'start',
    opts?: { disconnectedBridge?: boolean },
  ) => void
}

/** Pre-flight confirmation before starting a remote Ultraplan session. */
export function UltraplanLaunchDialog({
  onChoice,
}: UltraplanLaunchDialogProps): React.ReactNode {
  const pending = useAppState(
    (s: AppState) => s.ultraplanLaunchPending,
  ) as AppState['ultraplanLaunchPending']
  if (!pending) {
    return null
  }

  return (
    <Dialog
      title="Ultraplan"
      subtitle="将在网页版 Claude Code 中起草计划（约 10–30 分钟）。"
      onCancel={() => onChoice('cancel')}
      hideInputGuide
    >
      <Box flexDirection="column" gap={1}>
        <Text dimColor>
          条款与说明：{CCR_TERMS_URL}
        </Text>
        {pending.blurb ? (
          <Text dimColor>提示：{pending.blurb}</Text>
        ) : null}
        <Select
          options={[
            { label: '开始', value: 'start' as const },
            { label: '取消', value: 'cancel' as const },
          ]}
          onChange={v => {
            if (v === 'cancel') {
              onChoice('cancel')
            } else {
              onChoice('start')
            }
          }}
          onCancel={() => onChoice('cancel')}
        />
      </Box>
    </Dialog>
  )
}
