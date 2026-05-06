/**
 * Standalone installs: install.sh places the binary under a fixed data directory
 * and sets CLAUDE_CODE_INSTALL_PREFIX. Load `$PREFIX/.env` here so API keys live
 * beside the binary while the process cwd stays the user's project directory.
 *
 * Does not override keys already present in the environment (shell / CI wins).
 *
 * 解析与 `parseEnvFileToMap` 一致：支持单/双引号跨多行的值（如标准 JSON），
 * 不再按「一行一个 KEY=VALUE」截断 `--list-models` 等所需的 `CLAUDE_CODE_COMPAT_PROVIDERS_JSON`。
 *
 * （与 Bun `dev` 时 `--env-file=仓库/.env` 的行为仍可能不完全相同；仅以安装前缀语义为准。）
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnvFileToMap } from '../utils/envFileParser.js'

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

  const parsed = parseEnvFileToMap(raw)
  for (const [key, val] of Object.entries(parsed)) {
    if (key in process.env) continue
    process.env[key] = val
  }
}

applyInstallPrefixEnvFile()
