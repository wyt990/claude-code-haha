import type { DangerousBackend } from './backends/dangerousBackend.js'

export class SessionManager {
  constructor(
    _backend: DangerousBackend,
    _opts: { idleTimeoutMs: number; maxSessions: number },
  ) {}

  async destroyAll(): Promise<void> {}
}
