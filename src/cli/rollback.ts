export type RollbackOptions = {
  list?: boolean
  dryRun?: boolean
  safe?: boolean
}

/**
 * `claude rollback` — Ant 内部版本回退。OSS 存根。
 */
export async function rollback(
  _target?: string,
  _options?: RollbackOptions,
): Promise<void> {
  process.stderr.write(
    '此构建未包含 `claude rollback` 的完整实现（通常为内部发布通道）。\n',
  )
  process.exit(1)
}
