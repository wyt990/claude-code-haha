import type { ReactNode } from 'react'

export async function computeDefaultInstallDir(): Promise<string> {
  return ''
}

type WizardProps = {
  defaultDir: string
  onInstalled: (dir: string) => void
  onCancel: () => void
  onError: (message: string) => void
}

/** Placeholder: assistant install wizard is not shipped in this tree. */
export function NewInstallWizard(_props: WizardProps): ReactNode {
  return null
}
