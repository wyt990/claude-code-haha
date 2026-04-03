/**
 * Provenance for skill_discovery attachments (telemetry / routing).
 * External builds stub this module; upstream may extend the union.
 */
export type DiscoverySignal =
  | 'turn_zero_user_input'
  | 'assistant_turn'
  | 'subagent_spawn'
