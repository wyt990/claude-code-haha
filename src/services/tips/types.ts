export type Tip = {
  id: string
  content: () => Promise<string> | string
  cooldownSessions?: number
  isRelevant?: (context?: TipContext) => boolean | Promise<boolean>
}

export type TipContext = Record<string, unknown>
