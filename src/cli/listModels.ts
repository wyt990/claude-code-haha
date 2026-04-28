/**
 * --list-models 命令实现
 * 显示所有配置的模型信息，包括环境变量、API 配置和可用模型列表
 *
 * 优化方案（2026-04-29）：
 * - 方案一：简化输出格式，只输出提供商和模型列表
 * - 方案二：修复模型名称显示，不拼接额外信息
 * - 方案三：OpenAI 兼容模式下隐藏内置模型
 * - 方案四：Zen 免费模型独立显示，不受 OpenAI 兼容模式限制
 */
import chalk from 'chalk'
import { enableConfigs } from '../utils/config.js'
import {
  getDefaultMainLoopModel,
  getDefaultMainLoopModelSetting,
  getMainLoopModel,
  getUserSpecifiedModelSetting,
  renderModelName,
} from '../utils/model/model.js'
import { getModelOptions } from '../utils/model/modelOptions.js'
import { getAPIProvider } from '../utils/model/providers.js'
import {
  isOpenAICompatApiMode,
} from '../services/api/openaiCompat/config.js'
import {
  getZenFreeModelPickerOptions,
  isZenFreeModelsFeatureEnabled,
  ensureZenFreeModelListLoaded,
  forceRefreshZenFreeModelList,
} from '../services/api/openaiCompat/zenFreeModels.js'
import {
  getCompatProviderEnvModelOptions,
  getCompatProvidersFromEnv,
} from '../services/api/openaiCompat/compatRouting.js'
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'

interface ListModelsOptions {
  json?: boolean
}

interface ListModelsResult {
  provider: string
  currentModel: string
  defaultModel: string
  builtinModels?: Array<{ id: string; alias?: string }>
  customModels: Array<{ id: string; source: string }>
  openaiCompat: {
    enabled: boolean
    providers: Array<{
      id: string
      baseUrl: string
      models: Array<{
        originalName: string
        routedValue: string
      }>
    }>
  }
  zenFreeModels: {
    enabled: boolean
    models: Array<{
      originalName: string
      routedValue: string
    }>
  }
  settings: {
    model?: string
    availableModels?: string[]
  }
}

/**
 * 收集模型配置数据
 */
async function collectModelData(): Promise<ListModelsResult> {
  const currentModel = getMainLoopModel()
  const defaultModel = getDefaultMainLoopModel()
  const provider = getAPIProvider()
  const settings = getSettings_DEPRECATED() || {}
  const openaiCompatEnabled = isOpenAICompatApiMode()
  const zenEnabled = isZenFreeModelsFeatureEnabled()

  // 方案三：OpenAI 兼容模式下隐藏内置模型
  const builtinModels = openaiCompatEnabled ? [] : getModelOptions(false).map(opt => ({
    id: opt.value ?? 'default',
    alias: opt.label !== opt.value ? opt.label : undefined,
  })).filter(m => m.id !== 'default')

  // 自定义模型（来自环境变量）
  const customModels: Array<{ id: string; source: string }> = []
  const customSonnet = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  const customOpus = process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  const customHaiku = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  const envCustom = process.env.ANTHROPIC_CUSTOM_MODEL_OPTION

  if (customSonnet) customModels.push({ id: customSonnet, source: 'ANTHROPIC_DEFAULT_SONNET_MODEL' })
  if (customOpus) customModels.push({ id: customOpus, source: 'ANTHROPIC_DEFAULT_OPUS_MODEL' })
  if (customHaiku) customModels.push({ id: customHaiku, source: 'ANTHROPIC_DEFAULT_HAIKU_MODEL' })
  if (envCustom) customModels.push({ id: envCustom, source: 'ANTHROPIC_CUSTOM_MODEL_OPTION' })

  // 方案二：OpenAI 兼容模型显示原始名称
  const compatProviders = getCompatProvidersFromEnv()
  const openaiCompatProviders = compatProviders.map(p => ({
    id: p.id,
    baseUrl: p.baseUrl,
    models: (p.models ?? []).map(m => ({
      originalName: m,
      routedValue: `${p.id}/${m}`,
    })),
  }))

  // 方案二 & 方案四：Zen 免费模型显示原始名称，且独立于 OpenAI 兼容模式
  // 在获取 Zen 模型前，先确保模型列表已加载（Zen 模型不写 .env，需运行时拉取）
  // 使用 forceRefresh 强制刷新，确保 --list-models 始终获取最新列表
  if (zenEnabled) {
    await forceRefreshZenFreeModelList()
  }
  const zenModels = zenEnabled ? getZenFreeModelPickerOptions().map(opt => {
    // 从 `zen/<id>` 中提取原始模型 ID
    const originalName = opt.value.startsWith('zen/') ? opt.value.slice(4) : opt.value
    return {
      originalName,
      routedValue: opt.value,
    }
  }) : []

  const result: ListModelsResult = {
    provider,
    currentModel: renderModelName(currentModel),
    defaultModel: renderModelName(defaultModel),
    builtinModels,
    customModels,
    openaiCompat: {
      enabled: openaiCompatEnabled,
      providers: openaiCompatProviders,
    },
    zenFreeModels: {
      enabled: zenEnabled,
      models: zenModels,
    },
    settings: {
      model: settings.model,
      availableModels: settings.availableModels,
    },
  }

  return result
}

/**
 * 输出文本格式的模型信息
 */
function outputTextFormat(data: ListModelsResult): void {
  console.log(chalk.bold('\n=== Claude Code 可用模型 ===\n'))

  console.log(`当前 API Provider: ${chalk.green(data.provider)}`)
  console.log(`当前模型：${chalk.cyan(data.currentModel)}`)
  console.log(`默认模型：${chalk.cyan(data.defaultModel)}`)

  // 内置模型（仅在非 OpenAI 兼容模式下显示）
  if (data.builtinModels && data.builtinModels.length > 0) {
    console.log(chalk.bold('\n内置模型（Anthropic API）:'))
    for (const model of data.builtinModels) {
      const label = model.alias ? `${model.id} (${model.alias})` : model.id
      console.log(`  - ${chalk.green(label)}`)
    }
  }

  // 自定义模型
  if (data.customModels.length > 0) {
    console.log(chalk.bold('\n自定义模型（环境变量）:'))
    for (const model of data.customModels) {
      console.log(`  - ${chalk.green(model.id)} ${chalk.gray(`(来自 ${model.source})`)}`)
    }
  }

  // OpenAI 兼容模型
  if (data.openaiCompat.enabled) {
    console.log(chalk.bold('\nOpenAI 兼容模型:'))
    if (data.openaiCompat.providers.length > 0) {
      for (const provider of data.openaiCompat.providers) {
        console.log(`  Provider: ${chalk.cyan(provider.id)}`)
        console.log(`    Base URL: ${chalk.gray(provider.baseUrl)}`)
        console.log(`    可用模型:`)
        for (const model of provider.models) {
          console.log(`      - ${chalk.green(model.originalName)} ${chalk.gray(`(路由：${model.routedValue})`)}`)
        }
      }
    } else {
      console.log(`  ${chalk.gray('(未配置 OpenAI 兼容提供商)')}`)
    }
  }

  // Zen 免费模型（方案四：独立显示）
  if (data.zenFreeModels.enabled) {
    console.log(chalk.bold('\nZen 免费模型（OpenCode）:'))
    if (data.zenFreeModels.models.length > 0) {
      for (const model of data.zenFreeModels.models) {
        console.log(`  - ${chalk.green(model.originalName)} ${chalk.gray(`(路由：${model.routedValue})`)}`)
      }
    } else {
      console.log(`  ${chalk.yellow('(尚未获取到 Zen 模型列表，请检查网络连接)')}`)
    }
  }

  // 设置文件配置
  if (data.settings.model || data.settings.availableModels) {
    console.log(chalk.bold('\n设置文件配置:'))
    if (data.settings.model) {
      console.log(`  model: ${chalk.magenta(data.settings.model)}`)
    }
    if (data.settings.availableModels) {
      console.log(`  availableModels: ${chalk.magenta(JSON.stringify(data.settings.availableModels))}`)
    }
  }

  console.log(chalk.bold('\n=== 输出结束 ===\n'))
}

/**
 * 输出 JSON 格式的模型信息
 */
function outputJsonFormat(data: ListModelsResult): void {
  console.log(JSON.stringify(data, null, 2))
}

/**
 * 输出 --list-models 信息
 */
export async function listModels(options?: ListModelsOptions): Promise<void> {
  enableConfigs()

  try {
    const data = await collectModelData()

    if (options?.json) {
      outputJsonFormat(data)
    } else {
      outputTextFormat(data)
    }
  } catch (error) {
    if (options?.json) {
      console.error('Error:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    } else {
      console.error(chalk.red(`\n错误：${error instanceof Error ? error.message : String(error)}`))
    }
  }
}
