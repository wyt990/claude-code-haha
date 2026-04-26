/**
 * 从 `.env` 文本解析键值（用于安装前缀环境管理；不调用 dotenv）。
 */

/**
 * 与 `formatEnvValue` / Bun `--env-file` 一致：对整段 value 作引号与反斜线反转义。
 * 供 `installPrefixEnv` 等手写解析处复用，避免 `JSON.parse` 因字面量 `\"` 而失败。
 */
function unquoteEnvRaw(raw: string): string {
  let val = raw.trim()
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    const q = val[0]!
    val = val.slice(1, -1)
    if (q === '"') {
      val = val
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
    } else {
      val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r')
    }
  }
  return val
}

export function unquoteEnvLineValue(raw: string): string {
  return unquoteEnvRaw(raw)
}

export function parseEnvFileToMap(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq <= 0) {
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    if (!key) {
      continue
    }
    const rawVal = trimmed.slice(eq + 1)
    out[key] = unquoteEnvRaw(rawVal)
  }
  return out
}
