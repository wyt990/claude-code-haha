import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'

/**
 * Shared transport surface for WebSocket / SSE / hybrid session ingress.
 */
export interface Transport {
  connect(): Promise<void>
  close(): void
  setOnData(handler: (data: string) => void): void
  setOnClose(handler: (code?: number) => void): void
  write(message: StdoutMessage): Promise<void>
}
