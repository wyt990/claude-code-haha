/* eslint-disable @typescript-eslint/no-explicit-any */

export function sanitizeInboundWebhookContent(_content: string | any[]): string {
  if (typeof _content === 'string') return _content
  return JSON.stringify(_content)
}
