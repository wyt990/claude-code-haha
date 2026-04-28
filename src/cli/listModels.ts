/**
 * --list-models 命令实现
 * 显示所有配置的模型信息，包括环境变量、API配置和可用模型列表
 */
import chalk from 'chalk'
import { enableConfigs } from '../utils/config.js'
import {
  getDefaultMainLoopModel,
  getDefaultMainLoopModelSetting,
  getMainLoopModel,
  getUserSpecifiedModelSetting,
  renderModelName,
  getDefaultOpusModel,
  getDefaultSonnetModel,
  getDefaultHaikuModel,
  parseUserSpecifiedModel,
} from '../utils/model/model.js'
import { MODEL_ALIASES } from '../utils/model/aliases.js'
import { getModelOptions } from '../utils/model/modelOptions.js'
import { getModelStrings } from '../utils/model/modelStrings.js'
import { getAPIProvider } from '../utils/model/providers.js'
import {
  isOpenAICompatApiMode,
} from '../services/api/openaiCompat/config.js'
import {
  getZenFreeModelPickerOptions,
  isZenFreeModelsFeatureEnabled,
  ZEN_OPENAI_BASE_URL,
} from '../services/api/openaiCompat/zenFreeModels.js'
import {
  getCompatProviderEnvModelOptions,
} from '../services/api/openaiCompat/compatRouting.js'
import { getSettings_DEPRECATED } from '../utils/settings/settings.js'
import { isClaudeAISubscriber, isMaxSubscriber, isTeamPremiumSubscriber, getSubscriptionType } from '../utils/auth.js'

interface ListModelsOptions {
  json?: boolean
}

interface ListModelsResult {
  current: {
    userSpecified: string | null
    parsed: string
    default: string
    defaultSetting: string | null
  }
  environment: Record<string, string>
  openaiCompat: {
    enabled: boolean
    baseUrl?: string
  }
  zenFreeModels: {
    enabled: boolean
    baseUrl: string
    modelsCount: number
    models?: Array<{label: string, value: string, description?: string}>
  }
  provider: string
  auth: {
    isClaudeAISubscriber: boolean
    subscriptionType?: string
    isMaxSubscriber: boolean
    isTeamPremiumSubscriber: boolean
  }
  settings: {
    model?: string
    availableModels?: string[]
  }
  modelStrings: Record<string, string>
  modelAliases: {
    available: string[]
    resolved: Record<string, string>
  }
  defaults: {
    opus: string
    sonnet: string
    haiku: string
  }
  availableModels: Array<{label: string, value: string | null, description?: string}>
  openaiCompatModels?: Array<{label: string, value: string, description?: string}>
}

/**
 * 收集模型配置数据
 */
async function collectModelData(): Promise<ListModelsResult> {
  const userSpecifiedModel = getUserSpecifiedModelSetting()
  const currentModel = getMainLoopModel()
  const defaultModel = getDefaultMainLoopModel()
  const defaultModelSetting = getDefaultMainLoopModelSetting()
  const provider = getAPIProvider()
  const settings = getSettings_DEPRECATED() || {}
  const modelStrings = getModelStrings()
  const modelOptions = getModelOptions(false)

  const result: ListModelsResult = {
    current: {
      userSpecified: userSpecifiedModel ?? null,
      parsed: renderModelName(currentModel),
      default: renderModelName(defaultModel),
      defaultSetting: defaultModelSetting ?? null,
    },
    environment: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '(未设置)',
      ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN || '(未设置)',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || '(未设置)',
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || '(未设置)',
      ANTHROPIC_DEFAULT_OPUS_MODEL: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || '(未设置)',
      ANTHROPIC_DEFAULT_SONNET_MODEL: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || '(未设置)',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || '(未设置)',
      ANTHROPIC_CUSTOM_MODEL_OPTION: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION || '(未设置)',
      ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME || '(未设置)',
      ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION || '(未设置)',
      CLAUDE_CODE_USE_OPENAI_COMPAT_API: process.env.CLAUDE_CODE_USE_OPENAI_COMPAT_API || '(未设置)',
      CLAUDE_CODE_OPENAI_BASE_URL: process.env.CLAUDE_CODE_OPENAI_BASE_URL || '(未设置)',
      CLAUDE_CODE_ZEN_FREE_MODELS: process.env.CLAUDE_CODE_ZEN_FREE_MODELS || '(未设置)',
      CLAUDE_CODE_INSTALL_PREFIX: process.env.CLAUDE_CODE_INSTALL_PREFIX || '(未设置)',
    },
    openaiCompat: {
      enabled: isOpenAICompatApiMode(),
      baseUrl: process.env.CLAUDE_CODE_OPENAI_BASE_URL || undefined,
    },
    zenFreeModels: {
      enabled: isZenFreeModelsFeatureEnabled(),
      baseUrl: ZEN_OPENAI_BASE_URL,
      modelsCount: 0,
    },
    provider,
    auth: {
      isClaudeAISubscriber: isClaudeAISubscriber(),
      subscriptionType: getSubscriptionType() ?? undefined,
      isMaxSubscriber: isMaxSubscriber(),
      isTeamPremiumSubscriber: isTeamPremiumSubscriber(),
    },
    settings: {
      model: settings.model,
      availableModels: settings.availableModels,
    },
    modelStrings: {
      opus46: modelStrings.opus46,
      opus45: modelStrings.opus45,
      opus41: modelStrings.opus41,
      opus40: modelStrings.opus40,
      sonnet46: modelStrings.sonnet46,
      sonnet45: modelStrings.sonnet45,
      sonnet40: modelStrings.sonnet40,
      sonnet37: modelStrings.sonnet37,
      sonnet35: modelStrings.sonnet35,
      haiku45: modelStrings.haiku45,
      haiku35: modelStrings.haiku35,
    },
    modelAliases: {
      available: [...(MODEL_ALIASES as readonly string[])],
      resolved: {
        opus: renderModelName(parseUserSpecifiedModel('opus')),
        sonnet: renderModelName(parseUserSpecifiedModel('sonnet')),
        haiku: renderModelName(parseUserSpecifiedModel('haiku')),
      },
    },
    defaults: {
      opus: renderModelName(getDefaultOpusModel()),
      sonnet: renderModelName(getDefaultSonnetModel()),
      haiku: renderModelName(getDefaultHaikuModel()),
    },
    availableModels: modelOptions.map(opt => ({
      label: opt.label,
      value: opt.value,
      description: opt.description,
    })),
  }

  // Zen 免费模型
  if (result.zenFreeModels.enabled) {
    const zenModels = getZenFreeModelPickerOptions()
    result.zenFreeModels.modelsCount = zenModels.length
    result.zenFreeModels.models = zenModels.map(opt => ({
      label: opt.label,
      value: opt.value,
      description: opt.description,
    }))
  }

  // OpenAI 兼容模式下的额外模型
  if (result.openaiCompat.enabled) {
    const compatOptions = getCompatProviderEnvModelOptions()
    result.openaiCompatModels = compatOptions.map(opt => ({
      label: opt.label,
      value: opt.value ?? '',
      description: opt.description,
    }))
  }

  return result
}

/**
 * 输出文本格式的模型信息
 */
function outputTextFormat(data: ListModelsResult): void {
  console.log(chalk.bold('\n=== Claude Code 模型配置信息 ===\n'))

  // 1. 当前配置的模型
  console.log(chalk.bold(chalk.cyan('当前使用的模型')))
  if (data.current.userSpecified) {
    console.log(`  用户指定模型: ${chalk.green(data.current.userSpecified)}`)
    console.log(`  解析后的模型: ${chalk.green(data.current.parsed)}`)
  } else {
    console.log(`  当前模型: ${chalk.green(data.current.parsed)} (使用默认值)`)
  }
  console.log(`  默认模型设置: ${chalk.yellow(data.current.defaultSetting ?? 'null')}`)
  console.log(`  默认模型 (解析): ${chalk.yellow(data.current.default)}`)

  // 2. 环境变量配置 - 不脱敏
  console.log(chalk.bold(chalk.cyan('\n环境变量配置')))
  for (const [key, value] of Object.entries(data.environment)) {
    console.log(`  ${key}: ${chalk.magenta(value)}`)
  }

  // OpenAI 兼容模式相关
  console.log(chalk.bold(chalk.cyan('\nOpenAI 兼容模式配置')))
  console.log(`  CLAUDE_CODE_USE_OPENAI_COMPAT_API: ${chalk.magenta(data.environment.CLAUDE_CODE_USE_OPENAI_COMPAT_API)}`)
  console.log(`  当前模式: ${data.openaiCompat.enabled ? chalk.green('已启用') : chalk.gray('未启用')}`)

  if (data.openaiCompat.enabled) {
    console.log(`  CLAUDE_CODE_OPENAI_BASE_URL: ${chalk.magenta(data.environment.CLAUDE_CODE_OPENAI_BASE_URL)}`)
    console.log(`  （鉴权使用 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY，见 openaiCompat/config.ts）`)
  }

  if (data.environment.CLAUDE_CODE_INSTALL_PREFIX !== '(未设置)') {
    console.log(`  CLAUDE_CODE_INSTALL_PREFIX: ${chalk.cyan(data.environment.CLAUDE_CODE_INSTALL_PREFIX)}（安装目录 .env 由 preload 注入；可能与仓库 --env-file 叠加）`)
  } else {
    console.log(`  CLAUDE_CODE_INSTALL_PREFIX: ${chalk.gray('(未设置 — 非编译安装前缀场景)')}`)
  }

  // Zen 免费模型配置
  console.log(chalk.bold(chalk.cyan('\nZen 免费模型 (OpenCode) 配置')))
  console.log(`  CLAUDE_CODE_ZEN_FREE_MODELS: ${chalk.magenta(data.environment.CLAUDE_CODE_ZEN_FREE_MODELS)}`)
  console.log(`  Zen API Base URL: ${chalk.magenta(data.zenFreeModels.baseUrl)}`)
  console.log(`  Zen 功能启用状态: ${data.zenFreeModels.enabled ? chalk.green('已启用') : chalk.gray('未启用')}`)

  if (data.zenFreeModels.enabled) {
    console.log(`  已获取 Zen 模型数量: ${data.zenFreeModels.modelsCount}`)
  }

  // 3. API Provider 信息
  console.log(chalk.bold(chalk.cyan('\nAPI Provider')))
  console.log(`  当前 Provider: ${chalk.green(data.provider)}`)

  // 4. 用户认证状态
  console.log(chalk.bold(chalk.cyan('\n用户认证状态')))
  console.log(`  Claude.ai 订阅用户: ${data.auth.isClaudeAISubscriber ? chalk.green('是') : chalk.gray('否')}`)
  if (data.auth.isClaudeAISubscriber) {
    console.log(`  订阅类型: ${chalk.green(data.auth.subscriptionType ?? '未知')}`)
    console.log(`  Max 用户: ${data.auth.isMaxSubscriber ? chalk.green('是') : chalk.gray('否')}`)
    console.log(`  Team Premium 用户: ${data.auth.isTeamPremiumSubscriber ? chalk.green('是') : chalk.gray('否')}`)
  }

  // 5. 设置文件中的模型配置
  console.log(chalk.bold(chalk.cyan('\n设置文件配置')))
  console.log(`  model: ${chalk.magenta(data.settings.model ?? '(未设置)')}`)
  console.log(`  availableModels: ${data.settings.availableModels ? chalk.magenta(JSON.stringify(data.settings.availableModels)) : chalk.gray('(未设置 - 无限制)')}`)

  // 6. 模型字符串配置
  console.log(chalk.bold(chalk.cyan('\n模型 ID 字符串')))
  for (const [key, value] of Object.entries(data.modelStrings)) {
    console.log(`  ${key}: ${chalk.yellow(value)}`)
  }

  // 7. 模型别名
  console.log(chalk.bold(chalk.cyan('\n模型别名')))
  console.log(`  可用别名: ${chalk.green(data.modelAliases.available.join(', '))}`)
  console.log(`  'opus' 解析为: ${chalk.yellow(data.modelAliases.resolved.opus)}`)
  console.log(`  'sonnet' 解析为: ${chalk.yellow(data.modelAliases.resolved.sonnet)}`)
  console.log(`  'haiku' 解析为: ${chalk.yellow(data.modelAliases.resolved.haiku)}`)

  // 8. 默认模型解析
  console.log(chalk.bold(chalk.cyan('\n默认模型解析')))
  console.log(`  默认 Opus: ${chalk.yellow(data.defaults.opus)}`)
  console.log(`  默认 Sonnet: ${chalk.yellow(data.defaults.sonnet)}`)
  console.log(`  默认 Haiku: ${chalk.yellow(data.defaults.haiku)}`)

  // 9. 可用模型列表
  console.log(chalk.bold(chalk.cyan('\n可用模型列表 (Model Picker)')))
  const modelOptions = getModelOptions(false)
  for (const opt of data.availableModels) {
    const valueStr = opt.value === null ? '(default)' : opt.value
    console.log(`  ${chalk.green(opt.label)}: ${chalk.gray(valueStr)}`)
    if (opt.description) {
      console.log(`    描述: ${opt.description}`)
    }
  }

  // 10. OpenAI 兼容模型选项
  if (data.openaiCompat.enabled) {
    console.log(chalk.bold(chalk.cyan('\nOpenAI 兼容 Provider 环境模型')))
    if (data.openaiCompatModels) {
      for (const opt of data.openaiCompatModels) {
        console.log(`  ${chalk.green(opt.label)}: ${chalk.gray(opt.value)}`)
        if (opt.description) {
          console.log(`    描述: ${opt.description}`)
        }
      }
    }

    console.log(chalk.bold(chalk.cyan('\nZen 免费模型')))
    if (data.zenFreeModels.enabled) {
      if (data.zenFreeModels.models && data.zenFreeModels.models.length > 0) {
        for (const opt of data.zenFreeModels.models) {
          console.log(`  ${chalk.green(opt.label)}: ${chalk.gray(opt.value)}`)
          if (opt.description) {
            console.log(`    描述: ${opt.description}`)
          }
        }
      } else {
        console.log(chalk.yellow('  (尚未获取到 Zen 模型列表，请检查网络连接)'))
      }
    } else {
      console.log(chalk.gray('  (未启用 Zen 免费模型功能)'))
    }
  }

  console.log(chalk.bold('\n=== 信息结束 ===\n'))
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
      // JSON 模式下，错误输出到 stderr，确保 stdout 是有效 JSON
      console.error('Error:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    } else {
      console.error(chalk.red(`\n错误: ${error instanceof Error ? error.message : String(error)}`))
    }
  }
}