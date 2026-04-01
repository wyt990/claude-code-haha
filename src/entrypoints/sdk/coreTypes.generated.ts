// Local recovery stubs: upstream codegen artifact missing from this tree.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ApiKeySource = string
export type PermissionMode = string

export type SDKMessage = Record<string, any>
export type SDKUserMessage = Record<string, any>
export type SDKUserMessageReplay = Record<string, any>
export type SDKResultMessage = Record<string, any>
export type SDKSessionInfo = Record<string, any>
export type SDKAssistantMessage = Record<string, any>
/** SDK / UI use string error codes (e.g. rate_limit); stub matches runtime, not object-only schema. */
export type SDKAssistantMessageError = string
export type SDKCompactBoundaryMessage = Record<string, any>
export type SDKPermissionDenial = Record<string, any>
/** Runtime uses string codes (e.g. compacting) and null; schema may describe objects. */
export type SDKStatus = string | Record<string, any> | null
export type SDKPartialAssistantMessage = Record<string, any>
export type SDKRateLimitInfo = Record<string, any>
export type SDKStatusMessage = Record<string, any>
export type SDKSystemMessage = Record<string, any>
export type SDKToolProgressMessage = Record<string, any>

export type PermissionResult = Record<string, any>
export type McpServerConfigForProcessTransport = Record<string, any>
export type McpServerStatus = Record<string, any>
export type ModelInfo = Record<string, any>
export type ModelUsage = Record<string, any>
export type RewindFilesResult = Record<string, any>

export type HookInput = Record<string, any>
export type HookJSONOutput = Record<string, any>
export type SyncHookJSONOutput = Record<string, any>
export type AsyncHookJSONOutput = Record<string, any>
export type PermissionUpdate = Record<string, any>

export type PreToolUseHookInput = Record<string, any>
export type PostToolUseHookInput = Record<string, any>
export type PostToolUseFailureHookInput = Record<string, any>
export type NotificationHookInput = Record<string, any>
export type UserPromptSubmitHookInput = Record<string, any>
export type SessionStartHookInput = Record<string, any>
export type SessionEndHookInput = Record<string, any>
export type StopHookInput = Record<string, any>
export type StopFailureHookInput = Record<string, any>
export type SubagentStartHookInput = Record<string, any>
export type SubagentStopHookInput = Record<string, any>
export type PreCompactHookInput = Record<string, any>
export type PostCompactHookInput = Record<string, any>
export type PermissionDeniedHookInput = Record<string, any>
export type SetupHookInput = Record<string, any>
export type TeammateIdleHookInput = Record<string, any>
export type TaskCreatedHookInput = Record<string, any>
export type TaskCompletedHookInput = Record<string, any>
export type PermissionRequestHookInput = Record<string, any>
export type ElicitationHookInput = Record<string, any>
export type ElicitationResultHookInput = Record<string, any>
export type ConfigChangeHookInput = Record<string, any>
export type CwdChangedHookInput = Record<string, any>
export type FileChangedHookInput = Record<string, any>
export type InstructionsLoadedHookInput = Record<string, any>

export type SDKResultSuccess = Record<string, any>
