export type Tip = {
  id: string
  content: (context?: TipContext) => Promise<string> | string
  cooldownSessions?: number
  isRelevant?: (context?: TipContext) => boolean | Promise<boolean>
}

export type TipContext = Record<string, unknown>
