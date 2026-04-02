import type { ReactNode } from 'react'

export function shouldShowModelSwitchCallout(): boolean {
  return false
}

type Props = {
  onDone: (selection: string, modelAlias?: string) => void
}

/** Ant-only UI; stub for bundler (MACRO.BUILD_IS_ANT is false in OSS preload). */
export function AntModelSwitchCallout(_props: Props): ReactNode {
  return null
}
