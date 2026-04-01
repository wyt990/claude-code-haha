/**
 * `claude up` — 执行 CLAUDE.md 中「# claude up」段落。Ant 内部工作流；OSS 存根。
 */
export async function up(): Promise<void> {
  process.stderr.write(
    '此构建未包含 `claude up` 的完整实现（通常为内部开发环境引导）。\n',
  )
  process.exit(1)
}
