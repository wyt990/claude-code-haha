/**
 * 从 `.env` 文本解析键值（用于安装前缀环境管理；不调用 dotenv）。
 *
 * parseEnvFileToMap：支持双引号 / 单引号包裹的**多行**值（与常见 dotenv 行为一致），
 * 便于 `CLAUDE_CODE_COMPAT_PROVIDERS_JSON` 等标准 JSON 多行书写；同一键后者覆盖前者。
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

/** 跨过行尾 `#` 直至换行（引号值闭合后的行内注释）。 */
function skipLineComment(text: string, j: number): number {
  let i = j
  while (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
    i++
  }
  return i
}

/** 闭合引号之后的空白、可选 `#` 注释与换行。 */
function consumeAfterQuotedValue(text: string, endQuote: number): number {
  let i = endQuote
  while (i < text.length && (text[i] === ' ' || text[i] === '\t')) {
    i++
  }
  if (text[i] === '#') {
    i = skipLineComment(text, i)
  }
  if (text[i] === '\r') {
    i++
  }
  if (text[i] === '\n') {
    i++
  }
  return i
}

/**
 * 从 opening `"` 起读取双引号字符串，允许跨行；支持 `\"` `\\` `\n` `\r` `\t`。
 */
function readDoubleQuotedValue(text: string, openIndex: number): { value: string; next: number } {
  let j = openIndex + 1
  const parts: string[] = []
  while (j < text.length) {
    const c = text[j]!
    if (c === '\\' && j + 1 < text.length) {
      const n = text[j + 1]!
      if (n === 'n') {
        parts.push('\n')
        j += 2
        continue
      }
      if (n === 'r') {
        parts.push('\r')
        j += 2
        continue
      }
      if (n === 't') {
        parts.push('\t')
        j += 2
        continue
      }
      if (n === '"' || n === '\\') {
        parts.push(n)
        j += 2
        continue
      }
      parts.push(n)
      j += 2
      continue
    }
    if (c === '"') {
      return { value: parts.join(''), next: consumeAfterQuotedValue(text, j + 1) }
    }
    parts.push(c)
    j++
  }
  return { value: parts.join(''), next: j }
}

/**
 * 从 opening `'` 起读取单引号字符串，允许跨行；内容字面量直至下一个 `'`（JSON 等多用此法）。
 */
function readSingleQuotedValue(text: string, openIndex: number): { value: string; next: number } {
  let j = openIndex + 1
  const parts: string[] = []
  while (j < text.length) {
    const c = text[j]!
    if (c === "'") {
      return { value: parts.join(''), next: consumeAfterQuotedValue(text, j + 1) }
    }
    parts.push(c)
    j++
  }
  return { value: parts.join(''), next: j }
}

/**
 * 解析 `.env` 全文为键值映射。支持：
 * - 以 `#` 开头的注释行；
 * - 无引号单行值（仍对整段 trimming 后用 `unquoteEnvRaw` 处理一对引号收尾的惯例）；
 * - 双引号 / 单引号包裹的**多行**值。
 */
export function parseEnvFileToMap(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  let text = raw
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  let i = 0
  const n = text.length

  while (i < n) {
    const c = text[i]!
    if (c === '\r' || c === '\n') {
      i++
      continue
    }
    if (c === ' ' || c === '\t') {
      i++
      continue
    }
    if (c === '#') {
      i = skipLineComment(text, i)
      if (text[i] === '\r') {
        i++
      }
      if (text[i] === '\n') {
        i++
      }
      continue
    }

    const keyStart = i
    while (i < n && text[i] !== '=' && text[i] !== '\n' && text[i] !== '\r') {
      i++
    }

    const key = text.slice(keyStart, i).trim()
    if (i >= n || text[i] !== '=' || !key) {
      while (i < n && text[i] !== '\n' && text[i] !== '\r') {
        i++
      }
      if (text[i] === '\r') {
        i++
      }
      if (text[i] === '\n') {
        i++
      }
      continue
    }

    i++
    while (i < n && (text[i] === ' ' || text[i] === '\t')) {
      i++
    }

    if (i >= n) {
      out[key] = ''
      break
    }
    if (text[i] === '\r' || text[i] === '\n') {
      out[key] = ''
      if (text[i] === '\r') {
        i++
      }
      if (text[i] === '\n') {
        i++
      }
      continue
    }

    if (text[i] === '"') {
      const { value, next } = readDoubleQuotedValue(text, i)
      out[key] = value
      i = next
      continue
    }

    if (text[i] === "'") {
      const { value, next } = readSingleQuotedValue(text, i)
      out[key] = value
      i = next
      continue
    }

    const lineStart = i
    while (i < n && text[i] !== '\n' && text[i] !== '\r') {
      i++
    }
    const lineVal = text.slice(lineStart, i).trim()
    out[key] = unquoteEnvRaw(lineVal)

    if (text[i] === '\r') {
      i++
    }
    if (text[i] === '\n') {
      i++
    }
  }

  return out
}
