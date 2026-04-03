/* eslint-disable @typescript-eslint/no-explicit-any */

export function startUdsMessaging(_socketPath: string, ..._args: any[]): void {
  // Stub - feature-gated on UDS_INBOX
}

export function getDefaultUdsSocketPath(): string {
  return '/tmp/uds-socket'
}
