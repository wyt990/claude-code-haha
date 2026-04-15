/**
 * 安装前缀 `.env` 中 `CLAUDE_CODE_COMPAT_PROVIDERS_JSON` 的增删改查。
 */
import { readFileSync } from 'node:fs'

import {
  type CompatProviderJsonEntry,
  parseCompatProvidersJsonString,
} from '../services/api/openaiCompat/compatRouting.js'
import { parseEnvFileToMap } from '../utils/envFileParser.js'
import { ManagedEnvError, ensureManagedEnvFileReady } from '../utils/managedEnvFile.js'
import { updateManagedEnvFile } from '../utils/envFileWriter.js'

const KEY = 'CLAUDE_CODE_COMPAT_PROVIDERS_JSON'

function readProvidersFromDisk(): CompatProviderJsonEntry[] {
  const envPath = ensureManagedEnvFileReady()
  const map = parseEnvFileToMap(readFileSync(envPath, 'utf8'))
  return parseCompatProvidersJsonString(map[KEY])
}

async function writeProviders(entries: CompatProviderJsonEntry[]): Promise<void> {
  if (entries.length === 0) {
    await updateManagedEnvFile({ [KEY]: null })
    return
  }
  await updateManagedEnvFile({
    [KEY]: JSON.stringify(entries),
  })
}

function assertValidNewId(id: string): string {
  const t = id.trim().toLowerCase()
  if (!t) {
    throw new ManagedEnvError('渠道 id 不能为空')
  }
  if (t === 'zen') {
    throw new ManagedEnvError('id「zen」为内置路由保留，请使用其它 id')
  }
  return t
}

export async function addCompatProvider(options: {
  id: string
  baseUrl: string
  apiKey?: string
  apiKeyEnv?: string
  allowAllModels?: boolean
  models?: string[]
}): Promise<void> {
  const id = assertValidNewId(options.id)
  const baseUrl = options.baseUrl.trim().replace(/\/+$/, '')
  if (!baseUrl) {
    throw new ManagedEnvError('--base-url 无效')
  }
  const hasKey = Boolean(options.apiKey?.trim())
  const hasEnv = Boolean(options.apiKeyEnv?.trim())
  if (hasKey === hasEnv) {
    throw new ManagedEnvError('请二选一设置 --api-key 或 --api-key-env')
  }
  const existing = readProvidersFromDisk()
  if (existing.some(p => p.id.toLowerCase() === id)) {
    throw new ManagedEnvError(`渠道「${id}」已存在`)
  }
  const entry: CompatProviderJsonEntry = {
    id,
    baseUrl,
    ...(hasKey ? { apiKey: options.apiKey!.trim() } : {}),
    ...(hasEnv ? { apiKeyEnv: options.apiKeyEnv!.trim() } : {}),
  }
  if (!options.allowAllModels && options.models?.length) {
    entry.models = [...options.models]
  }
  existing.push(entry)
  await writeProviders(existing)
}

export async function removeCompatProvider(providerId: string): Promise<void> {
  const id = providerId.trim().toLowerCase()
  const existing = readProvidersFromDisk()
  const filtered = existing.filter(p => p.id.toLowerCase() !== id)
  if (filtered.length === existing.length) {
    throw new ManagedEnvError(`渠道「${providerId}」不存在`)
  }
  await writeProviders(filtered)
}

export function listCompatProvidersText(): string {
  const existing = readProvidersFromDisk()
  if (existing.length === 0) {
    return '（未配置 CLAUDE_CODE_COMPAT_PROVIDERS_JSON 或列表为空）\n'
  }
  const lines: string[] = []
  for (const p of existing) {
    lines.push(`- id: ${p.id}`)
    lines.push(`  baseUrl: ${p.baseUrl}`)
    if (p.apiKeyEnv) {
      lines.push(`  apiKeyEnv: ${p.apiKeyEnv}`)
    }
    if (p.apiKey) {
      lines.push(`  apiKey: （已设置，勿在日志中展示明文）`)
    }
    lines.push(
      `  models: ${p.models?.length ? p.models.join(', ') : '（不限制，由网关校验）'}`,
    )
    lines.push('')
  }
  return lines.join('\n')
}

export async function updateCompatProvider(options: {
  id: string
  baseUrl?: string
  apiKey?: string
  apiKeyEnv?: string
  clearApiKey?: boolean
  clearApiKeyEnv?: boolean
}): Promise<void> {
  const id = options.id.trim().toLowerCase()
  const existing = readProvidersFromDisk()
  const idx = existing.findIndex(p => p.id.toLowerCase() === id)
  if (idx < 0) {
    throw new ManagedEnvError(`渠道「${options.id}」不存在`)
  }
  const cur = { ...existing[idx] }
  if (options.baseUrl !== undefined) {
    const u = options.baseUrl.trim().replace(/\/+$/, '')
    if (!u) {
      throw new ManagedEnvError('--base-url 无效')
    }
    cur.baseUrl = u
  }
  if (options.clearApiKey) {
    delete cur.apiKey
  } else if (options.apiKey !== undefined) {
    const v = options.apiKey.trim()
    if (v) {
      cur.apiKey = v
      delete cur.apiKeyEnv
    }
  }
  if (options.clearApiKeyEnv) {
    delete cur.apiKeyEnv
  } else if (options.apiKeyEnv !== undefined) {
    const v = options.apiKeyEnv.trim()
    if (v) {
      cur.apiKeyEnv = v
      delete cur.apiKey
    }
  }
  if (!cur.apiKey && !cur.apiKeyEnv) {
    throw new ManagedEnvError('更新后渠道缺少 apiKey 与 apiKeyEnv，请至少保留其一')
  }
  existing[idx] = cur
  await writeProviders(existing)
}

export async function addModelToCompatProvider(
  providerId: string,
  model: string,
): Promise<void> {
  const id = providerId.trim().toLowerCase()
  const m = model.trim()
  if (!m) {
    throw new ManagedEnvError('--model 不能为空')
  }
  const existing = readProvidersFromDisk()
  const idx = existing.findIndex(p => p.id.toLowerCase() === id)
  if (idx < 0) {
    throw new ManagedEnvError(`渠道「${providerId}」不存在`)
  }
  const cur = { ...existing[idx] }
  const models = cur.models?.length ? [...cur.models] : []
  if (models.includes(m)) {
    throw new ManagedEnvError(`模型「${m}」已在列表中`)
  }
  models.push(m)
  cur.models = models
  existing[idx] = cur
  await writeProviders(existing)
}

export async function removeModelFromCompatProvider(
  providerId: string,
  model: string,
): Promise<void> {
  const id = providerId.trim().toLowerCase()
  const m = model.trim()
  const existing = readProvidersFromDisk()
  const idx = existing.findIndex(p => p.id.toLowerCase() === id)
  if (idx < 0) {
    throw new ManagedEnvError(`渠道「${providerId}」不存在`)
  }
  const cur = { ...existing[idx] }
  if (!cur.models?.length) {
    throw new ManagedEnvError('该渠道未配置有限 models 列表（当前为不限制），无法按名移除')
  }
  const models = cur.models.filter(x => x !== m)
  if (models.length === cur.models.length) {
    throw new ManagedEnvError(`模型「${m}」不在渠道列表中`)
  }
  cur.models = models.length ? models : undefined
  existing[idx] = cur
  await writeProviders(existing)
}
