/**
 * Stub: full message model is absent from this repo snapshot.
 * Type-only imports across the codebase; `any` keeps local TS checking unblocked.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type AssistantMessage = any
export type AttachmentMessage<_T = unknown> = any
export type CollapsedReadSearchGroup = any
export type CollapsibleMessage = any
export type CompactMetadata = any
export type GroupedToolUseMessage = any
export type HookResultMessage = any
export type Message = any
export type MessageOrigin = any
export type NormalizedAssistantMessage<_T = unknown> = any
export type NormalizedMessage = any
export type NormalizedUserMessage = any
export type PartialCompactDirection = any
/** Generic parameter matches upstream shape; body is stubbed as `any`. */
export type ProgressMessage<_T = unknown> = any
export type RenderableMessage = any
export type RequestStartEvent = any
export type StopHookInfo = any
export type StreamEvent = any
export type SystemAPIErrorMessage = any
export type SystemAgentsKilledMessage = any
export type SystemApiMetricsMessage = any
export type SystemAwaySummaryMessage = any
export type SystemBridgeStatusMessage = any
/**
 * Narrow enough that `isCompactBoundaryMessage`’s false branch is not `never`,
 * but loose enough for stubbed message shapes (compact metadata, etc.).
 */
export type SystemCompactBoundaryMessage = {
  type: 'system'
  subtype: 'compact_boundary'
  content?: unknown
  isMeta?: boolean
  timestamp?: string
  uuid?: string
  level?: unknown
  compactMetadata?: {
    trigger?: unknown
    preTokens?: number
    userContext?: unknown
    messagesSummarized?: number
    preservedSegment?: unknown
    /** Tool names discovered pre-compact; preserved for post-compact schema filtering. */
    preCompactDiscoveredTools?: string[]
  }
  logicalParentUuid?: string
}
export type SystemFileSnapshotMessage = any
export type SystemInformationalMessage = any
export type SystemLocalCommandMessage = any
export type SystemMemorySavedMessage = any
export type SystemMessage = any
export type SystemMessageLevel = any
export type SystemMicrocompactBoundaryMessage = any
export type SystemPermissionRetryMessage = any
export type SystemScheduledTaskFireMessage = any
export type SystemStopHookSummaryMessage = any
export type SystemThinkingMessage = any
export type SystemTurnDurationMessage = any
export type TombstoneMessage = any
export type ToolUseSummaryMessage = any
export type UserMessage = any
