/**
 * 在安装前缀 `.env` 上执行带锁的原地更新，尽量保留未改动行与注释。
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { formatEnvValue } from './envFileFormatter.js'
import * as lockfile from './lockfile.js'
import { ensureManagedEnvFileReady } from './managedEnvFile.js'

const LOCK_RETRIES = {
  retries: 30,
  minTimeout: 5,
  maxTimeout: 100,
} as const

/**
 * @param updates 键 → 新值；`null` 表示删除该键所在行。
 */
export async function updateManagedEnvFile(
  updates: Record<string, string | null>,
): Promise<void> {
  const envPath = ensureManagedEnvFileReady()
  const lockPath = `${envPath}.managed.lock`

  const release = await lockfile.lock(envPath, {
    lockfilePath: lockPath,
    retries: LOCK_RETRIES,
    onCompromised: () => {},
  })
  try {
    let raw = ''
    try {
      raw = readFileSync(envPath, 'utf8')
    } catch {
      raw = ''
    }
    const lines = raw.split('\n')
    const result: string[] = []
    const processedKeys = new Set<string>()

    for (const line of lines) {
      const trimmed = line.trim()
      const eqIndex = trimmed.indexOf('=')

      if (eqIndex > 0 && !trimmed.startsWith('#')) {
        const key = trimmed.slice(0, eqIndex).trim()
        if (key in updates) {
          processedKeys.add(key)
          const value = updates[key]
          if (value !== null) {
            result.push(`${key}=${formatEnvValue(value)}`)
          }
          continue
        }
      }

      result.push(line)
    }

    for (const [key, value] of Object.entries(updates)) {
      if (!processedKeys.has(key) && value !== null) {
        if (result.length > 0 && result[result.length - 1] !== '') {
          result.push('')
        }
        result.push(`${key}=${formatEnvValue(value)}`)
      }
    }

    writeFileSync(envPath, result.join('\n'), 'utf8')
  } finally {
    await release()
  }
}
