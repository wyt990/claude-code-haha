import memoize from 'lodash-es/memoize.js'
import { normalizeModelStringForAPI } from 'src/utils/model/model.js'
import {
  buildOpenAIChatCompletionsUrlFromBase,
  getOpenAIAuthHeaders,
  getOpenAIChatCompletionsUrl,
  isOpenAICompatApiMode,
} from './config.js'
import { ZEN_OPENAI_BASE_URL } from './zenFreeModels.js'

const ZEN_PREFIX = 'zen'

export type CompatProviderJsonEntry = {
  id: string
  baseUrl: string
  /** 直接密钥（不推荐提交到仓库） */
  apiKey?: string
  /** 从 process.env[name] 读取密钥 */
  apiKeyEnv?: string
  /** 若为空，则允许任意 `id/模型名`（由网关在服务端校验） */
  models?: string[]
}

function parseCompatProvidersJson(): CompatProviderJsonEntry[] {
  const raw = process.env.CLAUDE_CODE_COMPAT_PROVIDERS_JSON?.trim()
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    const out: CompatProviderJsonEntry[] = []
    for (const x of parsed) {
      if (!x || typeof x !== 'object') {
        continue
      }
      const o = x as Record<string, unknown>
      if (typeof o.id !== 'string' || !o.id.trim()) {
        continue
      }
      if (typeof o.baseUrl !== 'string' || !o.baseUrl.trim()) {
        continue
      }
      const models =
        Array.isArray(o.models) && o.models.every(m => typeof m === 'string')
          ? (o.models as string[])
          : undefined
      out.push({
        id: o.id.trim(),
        baseUrl: o.baseUrl.trim().replace(/\/+$/, ''),
        ...(typeof o.apiKey === 'string' && o.apiKey.trim()
          ? { apiKey: o.apiKey.trim() }
          : {}),
        ...(typeof o.apiKeyEnv === 'string' && o.apiKeyEnv.trim()
          ? { apiKeyEnv: o.apiKeyEnv.trim() }
          : {}),
        ...(models ? { models } : {}),
      })
    }
    return out
  } catch {
    return []
  }
}

export const getCompatProvidersFromEnv = memoize(parseCompatProvidersJson)

function resolveProviderApiKey(p: CompatProviderJsonEntry): string {
  if (p.apiKey?.trim()) {
    return p.apiKey.trim()
  }
  if (p.apiKeyEnv?.trim()) {
    const v = process.env[p.apiKeyEnv.trim()]
    if (v?.trim()) {
      return v.trim()
    }
  }
  throw new Error(
    `OpenAI 兼容多服务商「${p.id}」缺少密钥：请在 JSON 中设置 apiKey 或 apiKeyEnv（对应环境变量需已导出）`,
  )
}

/**
 * 根据 `model` 解析 Chat Completions 的 URL、请求头、以及请求体里的 model 字段。
 * - `zen/<id>` → OpenCode Zen + Bearer public（与官方匿名层一致）
 * - `<providerId>/<model>` → CLAUDE_CODE_COMPAT_PROVIDERS_JSON 中的条目
 * - 否则 → 默认网关（CLAUDE_CODE_OPENAI_BASE_URL / ANTHROPIC_BASE_URL + 现有鉴权）
 */
export function resolveOpenAICompatRouting(model: string): {
  url: string
  headers: Record<string, string>
  bodyModel: string
} {
  const trimmed = normalizeModelStringForAPI(model).trim()
  const slash = trimmed.indexOf('/')
  if (slash > 0) {
    const prefix = trimmed.slice(0, slash)
    const rest = trimmed.slice(slash + 1).trim()
    if (!rest) {
      throw new Error(`模型 ID 无效：「${model}」在 / 后需要具体模型名`)
    }
    if (prefix.toLowerCase() === ZEN_PREFIX) {
      return {
        url: buildOpenAIChatCompletionsUrlFromBase(ZEN_OPENAI_BASE_URL),
        headers: {
          Authorization: 'Bearer public',
        },
        bodyModel: rest,
      }
    }
    const prov = getCompatProvidersFromEnv().find(
      p => p.id === prefix || p.id.toLowerCase() === prefix.toLowerCase(),
    )
    if (prov) {
      const key = resolveProviderApiKey(prov)
      return {
        url: buildOpenAIChatCompletionsUrlFromBase(prov.baseUrl),
        headers: {
          Authorization: `Bearer ${key}`,
        },
        bodyModel: rest,
      }
    }
  }

  return {
    url: getOpenAIChatCompletionsUrl(),
    headers: getOpenAIAuthHeaders(),
    bodyModel: trimmed,
  }
}

/** 供 /model：自 .env JSON 注册的 OpenAI 兼容多服务商条目。 */
export function getCompatProviderEnvModelOptions(): Array<{
  value: string
  label: string
  description: string
}> {
  if (!isOpenAICompatApiMode()) {
    return []
  }
  return getCompatProvidersFromEnv().flatMap(p => {
    const models = p.models ?? []
    if (models.length === 0) {
      return []
    }
    return models.map(m => ({
      value: `${p.id}/${m}`,
      label: `${m}（${p.id}）`,
      description: `OpenAI 兼容 · ${p.baseUrl}`,
    }))
  })
}

/** 是否匹配 CLAUDE_CODE_COMPAT_PROVIDERS_JSON 中某提供商的 `id/...` 路由。 */
export function isCompatEnvProviderRoutedModel(model: string): boolean {
  const trimmed = normalizeModelStringForAPI(model).trim()
  const slash = trimmed.indexOf('/')
  if (slash <= 0) {
    return false
  }
  const prefix = trimmed.slice(0, slash)
  if (prefix.toLowerCase() === ZEN_PREFIX) {
    return false
  }
  const rest = trimmed.slice(slash + 1).trim()
  if (!rest) {
    return false
  }
  const prov = getCompatProvidersFromEnv().find(
    p => p.id === prefix || p.id.toLowerCase() === prefix.toLowerCase(),
  )
  if (!prov) {
    return false
  }
  if (!prov.models?.length) {
    return true
  }
  return prov.models.includes(rest)
}
