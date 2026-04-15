/**
 * 从 `.env` 文本解析键值（用于安装前缀环境管理；不调用 dotenv）。
 */

function unquoteEnvRaw(raw: string): string {
  let val = raw.trim()
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1)
    val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"')
  }
  return val
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
