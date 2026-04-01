// Local recovery stubs for SDK control protocol (wire shapes).
/* eslint-disable @typescript-eslint/no-explicit-any */

export type SDKControlRequest = Record<string, any>
export type SDKControlResponse = Record<string, any>
export type SDKControlRequestInner = Record<string, any>
export type SDKControlCancelRequest = Record<string, any>
export type SDKControlPermissionRequest = Record<string, any>

export type StdinMessage = Record<string, any>
export type StdoutMessage = Record<string, any>

export type SDKControlInitializeRequest = Record<string, any>
export type SDKControlInitializeResponse = Record<string, any>
export type SDKControlMcpSetServersResponse = Record<string, any>
export type SDKControlReloadPluginsResponse = Record<string, any>

export type SDKPartialAssistantMessage = Record<string, any>
