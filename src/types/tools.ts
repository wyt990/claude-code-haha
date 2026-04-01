// Local stub: progress payload shapes for tools (upstream types not in tree).
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ToolProgressData =
  | AgentToolProgress
  | BashProgress
  | MCPProgress
  | REPLToolProgress
  | SkillToolProgress
  | TaskOutputProgress
  | WebSearchProgress
  | ShellProgress
  | PowerShellProgress
  | SdkWorkflowProgress
  | Record<string, any>

export type AgentToolProgress = Record<string, any>
export type BashProgress = Record<string, any>
export type MCPProgress = Record<string, any>
export type REPLToolProgress = Record<string, any>
export type SkillToolProgress = Record<string, any>
export type TaskOutputProgress = Record<string, any>
export type WebSearchProgress = Record<string, any>
export type ShellProgress = Record<string, any>
export type PowerShellProgress = Record<string, any>
export type SdkWorkflowProgress = Record<string, any>
