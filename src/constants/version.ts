/**
 * 程序版本号（展示、遥测、`-v`、发布包文件名等）的唯一维护点。
 * 仅在此处修改版本字符串。
 *
 * `bun run build:release` 会据此生成 `dist/releases/claudecode-<平台>-<版本>.tar.gz`，并默认把
 * 根目录 `package.json` 的 `"version"` 写成与本常量一致（可用 `--no-sync-package` 跳过）。
 *
 * 运行时仍可用环境变量 `CLAUDE_CODE_LOCAL_VERSION` 覆盖（由 preload 读取，见 preload.ts）。
 */
export const CLAUDE_CODE_VERSION = '100.0.12-local'
