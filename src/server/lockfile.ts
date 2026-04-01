export type RunningServerProbe = {
  pid: number
  httpUrl: string
}

export type ServerLockInfo = {
  pid: number
  port: number
  host: string
  httpUrl: string
  startedAt: number
}

export async function probeRunningServer(): Promise<RunningServerProbe | null> {
  return null
}

export async function writeServerLock(_info: ServerLockInfo): Promise<void> {}

export async function removeServerLock(): Promise<void> {}
