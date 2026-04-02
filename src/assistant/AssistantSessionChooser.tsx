import type { ReactNode } from 'react'
import type { AssistantSession } from './sessionDiscovery.js'

type Props = {
  sessions: AssistantSession[]
  onSelect: (id: string) => void
  onCancel: () => void
}

/** Placeholder: bridge/assistant UI is not shipped in this tree. */
export function AssistantSessionChooser(_props: Props): ReactNode {
  return null
}
