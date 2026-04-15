/**
 * 编译安装前缀 `.env` 的维护类子命令（与 `docs/环境变量与模型配置管理方案.md` 一致）。
 */
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'

import {
  addCompatProvider,
  addModelToCompatProvider,
  listCompatProvidersText,
  removeCompatProvider,
  removeModelFromCompatProvider,
  updateCompatProvider,
} from './providerManager.js'
import {
  PROVIDER_TEMPLATES,
  isProviderTemplateId,
} from './templates/providerTemplates.js'
import { maskEnvLineForDisplay } from '../utils/envFileFormatter.js'
import { parseEnvFileToMap } from '../utils/envFileParser.js'
import { ManagedEnvError, ensureManagedEnvFileReady } from '../utils/managedEnvFile.js'
import { updateManagedEnvFile } from '../utils/envFileWriter.js'
import { isEnvTruthy } from '../utils/envUtils.js'
import { isManagedEnvSubcommand } from './managedEnvCliFlags.js'

const UNSET_CONFIRM_KEYS = new Set([
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'CLAUDE_CODE_COMPAT_PROVIDERS_JSON',
])

function stripGlobalFlags(argv: string[]): {
  rest: string[]
  force: boolean
  raw: boolean
  merge: boolean
  includeSecrets: boolean
} {
  const rest: string[] = []
  let force = false
  let raw = false
  let merge = false
  let includeSecrets = false
  for (const a of argv) {
    if (a === '--force') {
      force = true
    } else if (a === '--raw') {
      raw = true
    } else if (a === '--merge') {
      merge = true
    } else if (a === '--include-secrets') {
      includeSecrets = true
    } else {
      rest.push(a)
    }
  }
  return { rest, force, raw, merge, includeSecrets }
}

function getFlagValue(tokens: string[], flag: string): string | undefined {
  const i = tokens.indexOf(flag)
  if (i < 0 || i + 1 >= tokens.length) {
    return undefined
  }
  const v = tokens[i + 1]
  if (v.startsWith('--')) {
    return undefined
  }
  return v
}

async function confirm(message: string, force: boolean): Promise<boolean> {
  if (force) {
    return true
  }
  if (!process.stdin.isTTY) {
    return false
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const ans = await rl.question(`${message} (y/N) `)
    const t = ans.trim().toLowerCase()
    return t === 'y' || t === 'yes'
  } finally {
    rl.close()
  }
}

function parseEnvDisplayLine(line: string, raw: boolean, includeSecrets: boolean): string {
  const t = line.trim()
  if (!t || t.startsWith('#')) {
    return line
  }
  const eq = t.indexOf('=')
  if (eq <= 0) {
    return line
  }
  const key = t.slice(0, eq).trim()
  const val = t.slice(eq + 1)
  if (raw || includeSecrets) {
    return `${key}=${val}`
  }
  const parsedVal = parseEnvFileToMap(`${key}=${val}`)[key] ?? val
  return `${key}=${maskEnvLineForDisplay(key, parsedVal)}`
}

function readManagedEnvRaw(): string {
  const p = ensureManagedEnvFileReady()
  return readFileSync(p, 'utf8')
}

function die(msg: string): never {
  // biome-ignore lint/suspicious/noConsole:: CLI
  console.error(msg)
  process.exit(1)
}

export async function runManagedEnvCli(argv: string[]): Promise<void> {
  const { rest, force, raw, merge, includeSecrets } = stripGlobalFlags(argv)
  const cmd = rest[0]
  if (!cmd || !isManagedEnvSubcommand(cmd)) {
    die(
      '未知的环境管理子命令。支持：--env-list、--env-set、--env-unset、--env-export、--env-import、--set-default-model、OpenAI 兼容与 Provider 相关选项（见文档）。',
    )
  }

  try {
    switch (cmd) {
      case '--env-list': {
        const text = readManagedEnvRaw()
        if (!raw && !includeSecrets) {
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(
            `# 文件: ${ensureManagedEnvFileReady()}（已脱敏；--raw 或 --include-secrets 需谨慎）\n`,
          )
        }
        for (const line of text.split('\n')) {
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(parseEnvDisplayLine(line, raw, includeSecrets))
        }
        return
      }
      case '--env-export': {
        if (includeSecrets && !(await confirm('将导出包含密钥的完整内容，确定继续？', force))) {
          die('已取消。非交互环境请使用 --force。')
        }
        const text = readManagedEnvRaw()
        for (const line of text.split('\n')) {
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(parseEnvDisplayLine(line, raw, includeSecrets))
        }
        return
      }
      case '--env-set': {
        const pair = rest[1]
        if (!pair || !pair.includes('=')) {
          die('用法: --env-set KEY=value')
        }
        const eq = pair.indexOf('=')
        const key = pair.slice(0, eq).trim()
        const value = pair.slice(eq + 1)
        if (!key) {
          die('KEY 不能为空')
        }
        await updateManagedEnvFile({ [key]: value })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已写入 ${key}`)
        return
      }
      case '--env-unset': {
        const key = rest[1]?.trim()
        if (!key) {
          die('用法: --env-unset KEY')
        }
        if (UNSET_CONFIRM_KEYS.has(key) && !(await confirm(`确定删除 ${key}？`, force))) {
          die('已取消。')
        }
        await updateManagedEnvFile({ [key]: null })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已删除 ${key}`)
        return
      }
      case '--env-import': {
        const file = rest[1]
        if (!file) {
          die('用法: --env-import <file> [--merge]')
        }
        const imported = parseEnvFileToMap(readFileSync(file, 'utf8'))
        const current = parseEnvFileToMap(readManagedEnvRaw())
        const updates: Record<string, string> = {}
        for (const [k, v] of Object.entries(imported)) {
          if (merge && k in current) {
            continue
          }
          updates[k] = v
        }
        await updateManagedEnvFile(updates)
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(
          `已导入 ${Object.keys(updates).length} 个键${merge ? '（merge：跳过已存在键）' : ''}`,
        )
        return
      }
      case '--set-default-model': {
        const a = rest[1]
        const b = rest[2]
        if (!a) {
          die('用法: --set-default-model <model> | --set-default-model sonnet|haiku|opus <model>')
        }
        const tier = a.toLowerCase()
        if (tier === 'sonnet' || tier === 'haiku' || tier === 'opus') {
          if (!b) {
            die('缺少模型名')
          }
          const map: Record<string, string> = {
            sonnet: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
            haiku: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
            opus: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
          }
          await updateManagedEnvFile({ [map[tier]]: b })
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(`已设置 ${map[tier]}=${b}`)
        } else {
          await updateManagedEnvFile({ ANTHROPIC_MODEL: a })
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(`已设置 ANTHROPIC_MODEL=${a}`)
        }
        return
      }
      case '--enable-openai-compat': {
        await updateManagedEnvFile({ CLAUDE_CODE_USE_OPENAI_COMPAT_API: '1' })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log('已启用 CLAUDE_CODE_USE_OPENAI_COMPAT_API=1')
        return
      }
      case '--disable-openai-compat': {
        await updateManagedEnvFile({ CLAUDE_CODE_USE_OPENAI_COMPAT_API: null })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log('已移除 CLAUDE_CODE_USE_OPENAI_COMPAT_API')
        return
      }
      case '--set-openai-base-url': {
        const url = rest[1]
        if (!url) {
          die('用法: --set-openai-base-url <url>')
        }
        await updateManagedEnvFile({ CLAUDE_CODE_OPENAI_BASE_URL: url })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log('已设置 CLAUDE_CODE_OPENAI_BASE_URL')
        return
      }
      case '--set-extra-body': {
        const json = rest[1]
        if (!json) {
          die('用法: --set-extra-body \'<json>\'')
        }
        try {
          JSON.parse(json)
        } catch {
          die('JSON 无效')
        }
        await updateManagedEnvFile({ CLAUDE_CODE_OPENAI_EXTRA_BODY: json })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log('已设置 CLAUDE_CODE_OPENAI_EXTRA_BODY')
        return
      }
      case '--add-provider': {
        const id = getFlagValue(rest, '--id')
        const baseUrl = getFlagValue(rest, '--base-url')
        const apiKey = getFlagValue(rest, '--api-key')
        const apiKeyEnv = getFlagValue(rest, '--api-key-env')
        const modelsRaw = getFlagValue(rest, '--models')
        if (!id || !baseUrl) {
          die('用法: --add-provider --id <id> --base-url <url> (--api-key … | --api-key-env …) [--models a,b|auto]')
        }
        const allowAllModels =
          !modelsRaw || modelsRaw.trim().toLowerCase() === 'auto'
        const models =
          modelsRaw && !allowAllModels
            ? modelsRaw.split(',').map(s => s.trim()).filter(Boolean)
            : undefined
        await addCompatProvider({
          id,
          baseUrl,
          apiKey,
          apiKeyEnv,
          allowAllModels,
          models,
        })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已添加渠道 ${id.trim().toLowerCase()}`)
        return
      }
      case '--remove-provider': {
        const id = rest[1]
        if (!id) {
          die('用法: --remove-provider <id>')
        }
        await removeCompatProvider(id)
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已删除渠道 ${id}`)
        return
      }
      case '--list-providers': {
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(listCompatProvidersText())
        return
      }
      case '--update-provider': {
        const id = getFlagValue(rest, '--id')
        if (!id) {
          die('用法: --update-provider --id <id> [--base-url …] [--api-key …|--api-key-env …]')
        }
        const baseUrl = getFlagValue(rest, '--base-url')
        const apiKey = getFlagValue(rest, '--api-key')
        const apiKeyEnv = getFlagValue(rest, '--api-key-env')
        await updateCompatProvider({
          id,
          ...(baseUrl !== undefined ? { baseUrl } : {}),
          ...(apiKey !== undefined ? { apiKey } : {}),
          ...(apiKeyEnv !== undefined ? { apiKeyEnv } : {}),
        })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已更新渠道 ${id}`)
        return
      }
      case '--add-model-to-provider': {
        const id = getFlagValue(rest, '--id')
        const model = getFlagValue(rest, '--model')
        if (!id || !model) {
          die('用法: --add-model-to-provider --id <id> --model <name>')
        }
        await addModelToCompatProvider(id, model)
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已向 ${id} 添加模型 ${model}`)
        return
      }
      case '--remove-model-from-provider': {
        const id = getFlagValue(rest, '--id')
        const model = getFlagValue(rest, '--model')
        if (!id || !model) {
          die('用法: --remove-model-from-provider --id <id> --model <name>')
        }
        await removeModelFromCompatProvider(id, model)
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已从 ${id} 移除模型 ${model}`)
        return
      }
      case '--enable-zen-models': {
        await updateManagedEnvFile({ CLAUDE_CODE_ZEN_FREE_MODELS: '1' })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log('已设置 CLAUDE_CODE_ZEN_FREE_MODELS=1')
        return
      }
      case '--disable-zen-models': {
        await updateManagedEnvFile({ CLAUDE_CODE_ZEN_FREE_MODELS: null })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log('已移除 CLAUDE_CODE_ZEN_FREE_MODELS')
        return
      }
      case '--list-zen-models': {
        const map = parseEnvFileToMap(readManagedEnvRaw())
        if (!isEnvTruthy(map.CLAUDE_CODE_ZEN_FREE_MODELS)) {
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(
            '安装前缀 .env 中未启用 CLAUDE_CODE_ZEN_FREE_MODELS；写入 1 后重试。',
          )
          return
        }
        process.env.CLAUDE_CODE_ZEN_FREE_MODELS = map.CLAUDE_CODE_ZEN_FREE_MODELS
        const { refreshZenFreeModelList, getZenFreeModelPickerOptions } =
          await import('../services/api/openaiCompat/zenFreeModels.js')
        await refreshZenFreeModelList()
        const opts = getZenFreeModelPickerOptions()
        if (opts.length === 0) {
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log('（尚未获取到 Zen 模型列表，请检查网络或限额）')
          return
        }
        for (const o of opts) {
          // biome-ignore lint/suspicious/noConsole:: CLI
          console.log(`${o.value}\t${o.label}`)
        }
        return
      }
      case '--use-provider-template': {
        const name = rest[1]
        if (!name || !isProviderTemplateId(name)) {
          die(
            `用法: --use-provider-template <${Object.keys(PROVIDER_TEMPLATES).join('|')}> --api-key-env … 或 --api-key …`,
          )
        }
        const apiKey = getFlagValue(rest, '--api-key')
        const apiKeyEnv = getFlagValue(rest, '--api-key-env')
        if (Boolean(apiKey?.trim()) === Boolean(apiKeyEnv?.trim())) {
          die('请二选一传入 --api-key 或 --api-key-env')
        }
        const tpl = PROVIDER_TEMPLATES[name]
        const allowAllModels = tpl.models.length === 0
        await addCompatProvider({
          id: name,
          baseUrl: tpl.baseUrl,
          apiKey,
          apiKeyEnv,
          allowAllModels,
          models: allowAllModels ? undefined : [...tpl.models],
        })
        // biome-ignore lint/suspicious/noConsole:: CLI
        console.log(`已按模板 ${name} 添加渠道`)
        return
      }
      default:
        die(`未实现的子命令: ${cmd}`)
    }
  } catch (e) {
    if (e instanceof ManagedEnvError) {
      die(e.message)
    }
    throw e
  }
}
