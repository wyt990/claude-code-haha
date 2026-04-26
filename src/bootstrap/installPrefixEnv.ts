/**
 * Standalone installs: install.sh places the binary under a fixed data directory
 * and sets CLAUDE_CODE_INSTALL_PREFIX. Load `$PREFIX/.env` here so API keys live
 * beside the binary while the process cwd stays the user's project directory.
 *
 * Does not override keys already present in the environment (shell / CI wins).
 *
 * 引号包裹的值须与 `envFileParser.unquoteEnvLineValue` 一致地反转义（尤其 JSON 的 `\"`），
 * 否则与 Bun `--env-file` 对同一 .env 的解析结果会不一致，导致如 CLAUDE_CODE_COMPAT_PROVIDERS_JSON 无法 JSON.parse。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { unquoteEnvLineValue } from '../utils/envFileParser.js'

function applyInstallPrefixEnvFile(): void {
  const prefix = process.env.CLAUDE_CODE_INSTALL_PREFIX?.trim()
  if (!prefix) return

  const envPath = join(prefix, '.env')
  if (!existsSync(envPath)) return

  let raw: string
  try {
    raw = readFileSync(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    if (!key) continue
    if (key in process.env) continue

    const valRaw = trimmed.slice(eq + 1).trim()
    process.env[key] = unquoteEnvLineValue(valRaw)
  }
}

applyInstallPrefixEnvFile()
