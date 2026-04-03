export type PostInterClaudeMessageResult =
  | { ok: true }
  | { ok: false; error: string }

/** Stub until bridge delivery is wired; callers expect `{ ok, error? }`, not `void`. */
export async function postInterClaudeMessage(
  _target: string,
  _message: string,
): Promise<PostInterClaudeMessageResult> {
  return {
    ok: false,
    error: 'Inter-session messaging is not available in this build',
  }
}
