/**
 * 编译安装场景下由 CLI 读写的 `.env` 路径（与 `installPrefixEnv.ts` 一致）。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { accessSync, constants as fsConstants } from 'node:fs'
import { dirname, join } from 'node:path'

export class ManagedEnvError extends Error {
  override name = 'ManagedEnvError'
}

/** `$CLAUDE_CODE_INSTALL_PREFIX/.env` */
export function getManagedEnvFilePath(): string {
  const prefix = process.env.CLAUDE_CODE_INSTALL_PREFIX?.trim()
  if (!prefix) {
    throw new ManagedEnvError(
      '未设置 CLAUDE_CODE_INSTALL_PREFIX。本组命令仅用于编译安装场景：请通过安装脚本启动，或手动 export 安装目录（与 .env 同目录的父路径）。',
    )
  }
  return join(prefix, '.env')
}

/** 确保父目录存在且可写；`.env` 不存在则创建空文件（供 lockfile 使用）。 */
export function ensureManagedEnvFileReady(): string {
  const envPath = getManagedEnvFilePath()
  const dir = dirname(envPath)
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    accessSync(dir, fsConstants.W_OK)
  } catch {
    throw new ManagedEnvError(`安装目录不可写或无法创建：${dir}`)
  }
  if (!existsSync(envPath)) {
    writeFileSync(envPath, '', 'utf8')
  }
  try {
    accessSync(envPath, fsConstants.W_OK)
  } catch {
    throw new ManagedEnvError(`无法写入环境文件：${envPath}`)
  }
  return envPath
}
