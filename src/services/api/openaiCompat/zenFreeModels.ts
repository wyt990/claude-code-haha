import { isEssentialTrafficOnly } from 'src/utils/privacyLevel.js'
import { logForDebugging } from 'src/utils/debug.js'
import { isEnvTruthy } from 'src/utils/envUtils.js'
import { logError } from 'src/utils/log.js'

/** OpenCode Zen OpenAI-compatible root（与官方文档一致，勿写入 .env） */
export const ZEN_OPENAI_BASE_URL = 'https://opencode.ai/zen/v1'

const ZEN_MODELS_URL = 'https://opencode.ai/zen/v1/models'

/**
 * `GET /v1/models` 可能包含非免费或限额策略不同的条目。当前按 OpenCode 侧习惯：
 * 仅当模型 id 中带有 `free`（不区分大小写，比较前已 toLowerCase）时视为本功能展示的「免费」项。
 */
function isZenIdListedAsFreeInPicker(id: string): boolean {
  return id.toLowerCase().includes('free')
}

let zenModelIdsLower: string[] = []
let zenLoadAttempted = false

export function isZenFreeModelsFeatureEnabled(): boolean {
  return isEnvTruthy(process.env.CLAUDE_CODE_ZEN_FREE_MODELS)
}

/**
 * 拉取 Zen 免费模型 ID 列表（仅内存，不写 .env）。
 * 受 CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC 等影响时与 bootstrap 一致跳过。
 */
export async function refreshZenFreeModelList(): Promise<void> {
  if (!isZenFreeModelsFeatureEnabled()) {
    zenModelIdsLower = []
    return
  }
  if (isEssentialTrafficOnly()) {
    logForDebugging('[Zen] Skipped model list fetch: essential-traffic-only')
    zenLoadAttempted = true
    return
  }
  zenLoadAttempted = true
  try {
    const r = await fetch(ZEN_MODELS_URL, {
      headers: { Accept: 'application/json' },
    })
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`)
    }
    const j = (await r.json()) as { data?: Array<{ id?: string }> }
    const rawIds = (j.data ?? [])
      .map(x => (typeof x.id === 'string' ? x.id.trim().toLowerCase() : ''))
      .filter(Boolean)
    const ids = rawIds.filter(isZenIdListedAsFreeInPicker)
    if (rawIds.length > 0 && ids.length === 0) {
      logForDebugging(
        `[Zen] Filtered 0 / ${rawIds.length} id(s) (only ids containing "free" are shown in the picker)`,
      )
    }
    zenModelIdsLower = ids
    logForDebugging(
      `[Zen] Loaded ${ids.length} free model id(s) (${rawIds.length} from API, after free-name filter)`,
    )
  } catch (e) {
    logError(e)
    zenModelIdsLower = []
  }
}

/** 供 /model 列表；同步，依赖预取已完成（见 preload / main）。 */
export function getZenFreeModelPickerOptions(): Array<{
  value: string
  label: string
  description: string
}> {
  if (!isZenFreeModelsFeatureEnabled()) {
    return []
  }
  return zenModelIdsLower.map(id => ({
    value: `zen/${id}`,
    label: `${id}（Zen 免费）`,
    description: 'OpenCode Zen 匿名层（按 IP 限额；列表运行时拉取，不写 .env）',
  }))
}

export function isZenRoutedModelId(model: string): boolean {
  const t = model.trim().toLowerCase()
  return t.startsWith('zen/')
}

export function isKnownZenModelId(model: string): boolean {
  const low = model.trim().toLowerCase()
  if (!low.startsWith('zen/')) {
    return false
  }
  const id = low.slice(4)
  return zenModelIdsLower.includes(id)
}

export async function ensureZenFreeModelListLoaded(): Promise<void> {
  if (!isZenFreeModelsFeatureEnabled()) {
    return
  }
  if (zenModelIdsLower.length > 0) {
    return
  }
  if (zenLoadAttempted) {
    return
  }
  await refreshZenFreeModelList()
}
