/**
 * `.env` 值的格式化与展示脱敏（安装前缀环境管理 CLI）。
 */

const SENSITIVE_KEY_SUBSTRINGS = [
  'KEY',
  'TOKEN',
  'SECRET',
  'PASSWORD',
  'APIKEY',
] as const

/** 与 `compatRouting` 中 JSON 字段一致，用于导出/列表时对 JSON 内嵌密钥脱敏。 */
export function isSensitiveEnvKey(key: string): boolean {
  const u = key.toUpperCase()
  return SENSITIVE_KEY_SUBSTRINGS.some(s => u.includes(s))
}

export function maskScalarValue(value: string): string {
  if (value.startsWith('sk-')) {
    return `sk-${'*'.repeat(Math.max(0, value.length - 3))}`
  }
  if (value.length > 6) {
    return `${value.slice(0, 2)}***${value.slice(-2)}`
  }
  return '***'
}

export function maskEnvLineForDisplay(key: string, value: string): string {
  if (key === 'CLAUDE_CODE_COMPAT_PROVIDERS_JSON') {
    return maskCompatProvidersJsonValue(value)
  }
  if (!isSensitiveEnvKey(key)) {
    return value
  }
  return maskScalarValue(value)
}

/**
 * 解析 JSON 数组，掩码各条目的 `apiKey` 字段后重新序列化；解析失败则整体脱敏。
 */
export function maskCompatProvidersJsonValue(raw: string): string {
  const t = raw.trim()
  if (!t) {
    return raw
  }
  try {
    const parsed = JSON.parse(t) as unknown
    if (!Array.isArray(parsed)) {
      return maskScalarValue(t)
    }
    const copy = parsed.map(entry => {
      if (!entry || typeof entry !== 'object') {
        return entry
      }
      const o = { ...(entry as Record<string, unknown>) }
      if (typeof o.apiKey === 'string' && o.apiKey.length > 0) {
        o.apiKey = maskScalarValue(o.apiKey)
      }
      return o
    })
    return JSON.stringify(copy)
  } catch {
    return maskScalarValue(t)
  }
}

/**
 * 将值格式化为可安全写入 `.env` 的一段（无引号或双引号包裹）。
 */
export function formatEnvValue(value: string): string {
  if (value === '') {
    return '""'
  }
  if (!/[\r\n"#=\\\s]/.test(value)) {
    return value
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`
}
