export type ConnectorTextBlock = {
  type: 'connector_text'
  text?: string
  /** Streaming/API alias for accumulated connector body (see `text`). */
  connector_text?: string
  signature?: string
}

export type ConnectorTextDelta = {
  type: 'connector_text_delta'
  text?: string
  connector_text?: string
}

export function isConnectorTextBlock(
  value: unknown,
): value is ConnectorTextBlock {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type?: unknown }).type === 'connector_text'
  );
}
