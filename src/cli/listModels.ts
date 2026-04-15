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

/**
 * 输出 --list-models 信息
 */
export async function listModels(): Promise<void> {
  enableConfigs()

  console.log(chalk.bold('\n=== Claude Code 模型配置信息 ===\n'))

  // 1. 当前配置的模型
  console.log(chalk.bold(chalk.cyan('当前使用的模型')))
  const userSpecifiedModel = getUserSpecifiedModelSetting()
  const currentModel = getMainLoopModel()
  const defaultModel = getDefaultMainLoopModel()
  const defaultModelSetting = getDefaultMainLoopModelSetting()

  if (userSpecifiedModel !== undefined && userSpecifiedModel !== null) {
    console.log(`  用户指定模型: ${chalk.green(userSpecifiedModel)}`)
    console.log(`  解析后的模型: ${chalk.green(renderModelName(currentModel))}`)
  } else {
    console.log(`  当前模型: ${chalk.green(renderModelName(currentModel))} (使用默认值)`)
  }
  console.log(`  默认模型设置: ${chalk.yellow(defaultModelSetting ?? 'null')}`)
  console.log(`  默认模型 (解析): ${chalk.yellow(renderModelName(defaultModel))}`)

  // 2. 环境变量配置 - 不脱敏
  console.log(chalk.bold(chalk.cyan('\n环境变量配置')))
  console.log(`  ANTHROPIC_API_KEY: ${chalk.magenta(process.env.ANTHROPIC_API_KEY || '(未设置)')}`)
  console.log(`  ANTHROPIC_AUTH_TOKEN: ${chalk.magenta(process.env.ANTHROPIC_AUTH_TOKEN || '(未设置)')}`)
  console.log(`  ANTHROPIC_BASE_URL: ${chalk.magenta(process.env.ANTHROPIC_BASE_URL || '(未设置)')}`)
  console.log(`  ANTHROPIC_MODEL: ${chalk.magenta(process.env.ANTHROPIC_MODEL || '(未设置)')}`)
  console.log(`  ANTHROPIC_DEFAULT_OPUS_MODEL: ${chalk.magenta(process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || '(未设置)')}`)
  console.log(`  ANTHROPIC_DEFAULT_SONNET_MODEL: ${chalk.magenta(process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || '(未设置)')}`)
  console.log(`  ANTHROPIC_DEFAULT_HAIKU_MODEL: ${chalk.magenta(process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || '(未设置)')}`)
  console.log(`  ANTHROPIC_CUSTOM_MODEL_OPTION: ${chalk.magenta(process.env.ANTHROPIC_CUSTOM_MODEL_OPTION || '(未设置)')}`)
  console.log(`  ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: ${chalk.magenta(process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME || '(未设置)')}`)
  console.log(`  ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION: ${chalk.magenta(process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION || '(未设置)')}`)

  // OpenAI 兼容模式相关
  console.log(chalk.bold(chalk.cyan('\nOpenAI 兼容模式配置')))
  console.log(`  CLAUDE_CODE_USE_OPENAI_COMPAT_API: ${chalk.magenta(process.env.CLAUDE_CODE_USE_OPENAI_COMPAT_API || '(未设置)')}`)
  console.log(`  当前模式: ${isOpenAICompatApiMode() ? chalk.green('已启用') : chalk.gray('未启用')}`)

  if (isOpenAICompatApiMode()) {
    console.log(`  CLAUDE_CODE_OPENAI_BASE_URL: ${chalk.magenta(process.env.CLAUDE_CODE_OPENAI_BASE_URL || '(未设置)')}`)
    console.log(`  （鉴权使用 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY，见 openaiCompat/config.ts）`)
  }

  const installPrefix = process.env.CLAUDE_CODE_INSTALL_PREFIX?.trim()
  if (installPrefix) {
    console.log(`  CLAUDE_CODE_INSTALL_PREFIX: ${chalk.cyan(installPrefix)}（安装目录 .env 由 preload 注入；可能与仓库 --env-file 叠加）`)
  } else {
    console.log(`  CLAUDE_CODE_INSTALL_PREFIX: ${chalk.gray('(未设置 — 非编译安装前缀场景)')}`)
  }

  // Zen 免费模型配置
  console.log(chalk.bold(chalk.cyan('\nZen 免费模型 (OpenCode) 配置')))
  console.log(`  CLAUDE_CODE_ZEN_FREE_MODELS: ${chalk.magenta(process.env.CLAUDE_CODE_ZEN_FREE_MODELS || '(未设置)')}`)
  console.log(`  Zen API Base URL: ${chalk.magenta(ZEN_OPENAI_BASE_URL)}`)
  console.log(`  Zen 功能启用状态: ${isZenFreeModelsFeatureEnabled() ? chalk.green('已启用') : chalk.gray('未启用')}`)

  if (isZenFreeModelsFeatureEnabled()) {
    const zenModels = getZenFreeModelPickerOptions()
    console.log(`  已获取 Zen 模型数量: ${zenModels.length}`)
  }

  // 3. API Provider 信息
  console.log(chalk.bold(chalk.cyan('\nAPI Provider')))
  const provider = getAPIProvider()
  console.log(`  当前 Provider: ${chalk.green(provider)}`)

  // 4. 用户认证状态
  console.log(chalk.bold(chalk.cyan('\n用户认证状态')))
  console.log(`  Claude.ai 订阅用户: ${isClaudeAISubscriber() ? chalk.green('是') : chalk.gray('否')}`)
  if (isClaudeAISubscriber()) {
    console.log(`  订阅类型: ${chalk.green(getSubscriptionType() ?? '未知')}`)
    console.log(`  Max 用户: ${isMaxSubscriber() ? chalk.green('是') : chalk.gray('否')}`)
    console.log(`  Team Premium 用户: ${isTeamPremiumSubscriber() ? chalk.green('是') : chalk.gray('否')}`)
  }

  // 5. 设置文件中的模型配置
  console.log(chalk.bold(chalk.cyan('\n设置文件配置')))
  const settings = getSettings_DEPRECATED() || {}
  console.log(`  model: ${chalk.magenta(settings.model ?? '(未设置)')}`)
  console.log(`  availableModels: ${settings.availableModels ? chalk.magenta(JSON.stringify(settings.availableModels)) : chalk.gray('(未设置 - 无限制)')}`)

  // 6. 模型字符串配置
  console.log(chalk.bold(chalk.cyan('\n模型 ID 字符串')))
  const modelStrings = getModelStrings()
  console.log(`  Opus 4.6: ${chalk.yellow(modelStrings.opus46)}`)
  console.log(`  Opus 4.5: ${chalk.yellow(modelStrings.opus45)}`)
  console.log(`  Opus 4.1: ${chalk.yellow(modelStrings.opus41)}`)
  console.log(`  Opus 4: ${chalk.yellow(modelStrings.opus40)}`)
  console.log(`  Sonnet 4.6: ${chalk.yellow(modelStrings.sonnet46)}`)
  console.log(`  Sonnet 4.5: ${chalk.yellow(modelStrings.sonnet45)}`)
  console.log(`  Sonnet 4: ${chalk.yellow(modelStrings.sonnet40)}`)
  console.log(`  Sonnet 3.7: ${chalk.yellow(modelStrings.sonnet37)}`)
  console.log(`  Sonnet 3.5: ${chalk.yellow(modelStrings.sonnet35)}`)
  console.log(`  Haiku 4.5: ${chalk.yellow(modelStrings.haiku45)}`)
  console.log(`  Haiku 3.5: ${chalk.yellow(modelStrings.haiku35)}`)

  // 7. 模型别名
  console.log(chalk.bold(chalk.cyan('\n模型别名')))
  console.log(`  可用别名: ${chalk.green((MODEL_ALIASES as readonly string[]).join(', '))}`)
  console.log(`  'opus' 解析为: ${chalk.yellow(renderModelName(parseUserSpecifiedModel('opus')))}`)
  console.log(`  'sonnet' 解析为: ${chalk.yellow(renderModelName(parseUserSpecifiedModel('sonnet')))}`)
  console.log(`  'haiku' 解析为: ${chalk.yellow(renderModelName(parseUserSpecifiedModel('haiku')))}`)

  // 8. 默认模型解析
  console.log(chalk.bold(chalk.cyan('\n默认模型解析')))
  console.log(`  默认 Opus: ${chalk.yellow(renderModelName(getDefaultOpusModel()))}`)
  console.log(`  默认 Sonnet: ${chalk.yellow(renderModelName(getDefaultSonnetModel()))}`)
  console.log(`  默认 Haiku: ${chalk.yellow(renderModelName(getDefaultHaikuModel()))}`)

  // 9. 可用模型列表
  console.log(chalk.bold(chalk.cyan('\n可用模型列表 (Model Picker)')))
  const modelOptions = getModelOptions(false)
  for (const opt of modelOptions) {
    const valueStr = opt.value === null ? '(default)' : opt.value
    console.log(`  ${chalk.green(opt.label)}: ${chalk.gray(valueStr)}`)
    if (opt.description) {
      console.log(`    描述: ${opt.description}`)
    }
  }

  // 10. OpenAI 兼容模型选项
  if (isOpenAICompatApiMode()) {
    console.log(chalk.bold(chalk.cyan('\nOpenAI 兼容 Provider 环境模型')))
    const compatOptions = getCompatProviderEnvModelOptions()
    for (const opt of compatOptions) {
      console.log(`  ${chalk.green(opt.label)}: ${chalk.gray(opt.value)}`)
      if (opt.description) {
        console.log(`    描述: ${opt.description}`)
      }
    }

    console.log(chalk.bold(chalk.cyan('\nZen 免费模型')))
    if (isZenFreeModelsFeatureEnabled()) {
      const zenModels = getZenFreeModelPickerOptions()
      if (zenModels.length > 0) {
        for (const opt of zenModels) {
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