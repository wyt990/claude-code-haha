/* eslint-disable @typescript-eslint/no-explicit-any */

export type DisplayGeometry = Record<string, any>
export type FrontmostApp = Record<string, any>
export type InstalledApp = Record<string, any>
export type ResolvePrepareCaptureResult = Record<string, any>
export type RunningApp = Record<string, any>
export type ScreenshotResult = Record<string, any>
export type ComputerUseSessionContext = Record<string, any>
export type CuCallToolResult = Record<string, any>
export type ScreenshotDims = { width: number; height: number; displayId?: number; originX?: number; originY?: number }

export const API_RESIZE_PARAMS = { maxWidth: 1920, maxHeight: 1080 }

export function targetImageSize(_physW: number, _physH: number, _params: typeof API_RESIZE_PARAMS): [number, number] {
  return [1920, 1080]
}

export function buildComputerUseTools(_capabilities: any, _coordinateMode: string, _installedApps?: string[]): any[] {
  return []
}

export function createComputerUseMcpServer(_adapter: any, _coordinateMode: string): any {
  return {
    setRequestHandler(_schema: any, _handler: any) {},
    connect(_transport: any) {
      return Promise.resolve()
    },
  }
}

export function bindSessionContext(_adapter: any, _coordinateMode: string, _ctx: any): any {
  return {}
}

export { CuPermissionRequest, CuPermissionResponse, DEFAULT_GRANT_FLAGS } from './ant-computer-use-types.js'

export type ComputerExecutor = any
