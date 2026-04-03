/* eslint-disable @typescript-eslint/no-explicit-any */

export async function sendToUdsSocket(_target: string, _message: string): Promise<void> {
  // Stub - feature-gated on UDS_INBOX
}

export async function listAllLiveSessions(): Promise<any[]> {
  return []
}
