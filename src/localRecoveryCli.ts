import Anthropic from '@anthropic-ai/sdk'
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { readFileSync } from 'fs'
import { createInterface } from 'readline'
import { isOpenAICompatApiMode } from './services/api/openaiCompat/config.js'
import {
  betaMessageAssistantText,
  openAICompatNonStreamingRequest,
} from './services/api/openaiCompat/openaiNonStreaming.js'

type OutputFormat = 'text' | 'json'

function printHelp(): void {
  process.stdout.write(
    [
      '用法：claudecode [选项] [提示词]',
      '',
      '本地降级模式（简化版 readline 交互）。',
      '',
      '选项：',
      '  -h, --help                    显示帮助信息',
      '  -v, --version                 显示版本号',
      '  （无参数）                     启动本地交互模式',
      '  -p, --print                   发送单个提示词并输出结果',
      '  --model <model>               覆盖模型设置',
      '  --system-prompt <text>        覆盖系统提示词',
      '  --system-prompt-file <file>   从文件读取系统提示词',
      '  --append-system-prompt <text> 追加到系统提示词末尾',
      '  --output-format <format>      输出格式：text（默认）或 json',
      '',
      '环境变量：',
      '  ANTHROPIC_API_KEY 或 ANTHROPIC_AUTH_TOKEN',
      '  ANTHROPIC_BASE_URL',
      '  ANTHROPIC_MODEL',
      '  API_TIMEOUT_MS',
      '  CLAUDE_CODE_USE_OPENAI_COMPAT_API  OpenAI Chat Completions 兼容模式',
      '',
    ].join('\n'),
  )
}

function printVersion(): void {
  process.stdout.write('100.0.0-local (Claude Code 本地降级版)\n')
}

function parseArgs(argv: string[]) {
  let print = false
  let model = process.env.ANTHROPIC_MODEL
  let systemPrompt: string | undefined
  let appendSystemPrompt: string | undefined
  let outputFormat: OutputFormat = 'text'
  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg) continue

    if (arg === '-h' || arg === '--help') {
      return { command: 'help' as const }
    }
    if (arg === '-v' || arg === '--version' || arg === '-V') {
      return { command: 'version' as const }
    }
    if (arg === '-p' || arg === '--print') {
      print = true
      continue
    }
    if (arg === '--bare') {
      continue
    }
    if (arg === '--dangerously-skip-permissions') {
      continue
    }
    if (arg === '--model') {
      model = argv[++i]
      continue
    }
    if (arg === '--system-prompt') {
      systemPrompt = argv[++i]
      continue
    }
    if (arg === '--system-prompt-file') {
      const file = argv[++i]
      systemPrompt = readFileSync(file!, 'utf8')
      continue
    }
    if (arg === '--append-system-prompt') {
      appendSystemPrompt = argv[++i]
      continue
    }
    if (arg === '--output-format') {
      const value = argv[++i]
      if (value === 'json' || value === 'text') {
        outputFormat = value
      }
      continue
    }
    if (arg.startsWith('-')) {
      continue
    }
    positional.push(arg)
  }

  return {
    command: 'run' as const,
    print,
    model,
    systemPrompt,
    appendSystemPrompt,
    outputFormat,
    prompt: positional.join(' ').trim(),
  }
}

async function readPromptFromStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }
  return Buffer.concat(chunks).toString('utf8').trim()
}

function getSystemPrompt(
  systemPrompt: string | undefined,
  appendSystemPrompt: string | undefined,
): string | undefined {
  if (systemPrompt && appendSystemPrompt) {
    return `${systemPrompt}\n\n${appendSystemPrompt}`
  }
  return systemPrompt ?? appendSystemPrompt
}

async function run(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2))

  if (parsed.command === 'help') {
    printHelp()
    return
  }
  if (parsed.command === 'version') {
    printVersion()
    return
  }

  if (!parsed.print) {
    await runInteractive(parsed)
    return
  }

  const prompt = parsed.prompt || (await readPromptFromStdin())
  if (!prompt) {
    process.stderr.write('错误：请输入提示词\n')
    process.exitCode = 1
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN
  if (!apiKey && !authToken) {
    process.stderr.write(
      '错误：请设置 ANTHROPIC_API_KEY 或 ANTHROPIC_AUTH_TOKEN\n',
    )
    process.exitCode = 1
    return
  }

  const model =
    parsed.model ||
    process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ||
    process.env.ANTHROPIC_MODEL

  if (!model) {
    process.stderr.write('错误：请指定模型\n')
    process.exitCode = 1
    return
  }

  const system = getSystemPrompt(parsed.systemPrompt, parsed.appendSystemPrompt)
  const streamParams: BetaMessageStreamParams = {
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
    ...(system !== undefined ? { system } : {}),
  }

  if (isOpenAICompatApiMode()) {
    const ms = parseInt(process.env.API_TIMEOUT_MS || String(600_000), 10)
    const ac = new AbortController()
    const tid = setTimeout(() => ac.abort(), ms)
    try {
      const msg = await openAICompatNonStreamingRequest(streamParams, ac.signal)
      if (parsed.outputFormat === 'json') {
        process.stdout.write(`${JSON.stringify(msg, null, 2)}\n`)
        return
      }
      process.stdout.write(`${betaMessageAssistantText(msg)}\n`)
    } finally {
      clearTimeout(tid)
    }
    return
  }

  const client = new Anthropic({
    apiKey: apiKey ?? undefined,
    authToken: authToken ?? undefined,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600_000), 10),
    maxRetries: 0,
  })

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: getSystemPrompt(parsed.systemPrompt, parsed.appendSystemPrompt),
    messages: [{ role: 'user', content: prompt }],
  })

  if (parsed.outputFormat === 'json') {
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`)
    return
  }

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')

  process.stdout.write(`${text}\n`)
}

async function runInteractive(parsed: {
  model?: string
  systemPrompt?: string
  appendSystemPrompt?: string
}): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN
  if (!apiKey && !authToken) {
    process.stderr.write(
      '错误：请设置 ANTHROPIC_API_KEY 或 ANTHROPIC_AUTH_TOKEN\n',
    )
    process.exitCode = 1
    return
  }

  const model =
    parsed.model ||
    process.env.ANTHROPIC_DEFAULT_SONNET_MODEL ||
    process.env.ANTHROPIC_MODEL

  if (!model) {
    process.stderr.write('错误：请指定模型\n')
    process.exitCode = 1
    return
  }

  // IDE / 重定向场景下 stdout 常非 TTY，readline 与欢迎语写到 stderr 才能看见
  const lineOut =
    process.stdout.isTTY ? process.stdout : process.stderr

  const system = getSystemPrompt(parsed.systemPrompt, parsed.appendSystemPrompt)
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  const recoveryTimeoutMs = parseInt(
    process.env.API_TIMEOUT_MS || String(600_000),
    10,
  )
  const anthropicClient: Anthropic | null = isOpenAICompatApiMode()
    ? null
    : new Anthropic({
        apiKey: apiKey ?? undefined,
        authToken: authToken ?? undefined,
        baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
        timeout: recoveryTimeoutMs,
        maxRetries: 0,
      })
  const rl = createInterface({
    input: process.stdin,
    output: lineOut,
    prompt: 'you> ',
  })

  if (!process.stdout.isTTY && process.stderr.isTTY) {
    lineOut.write(
      '提示：标准输出不是终端，交互提示与回复将显示在 stderr。\n\n',
    )
  }

  lineOut.write(
    `Claude Code 本地交互模式\n模型：${model}\n命令：/exit（退出）, /clear（清空历史）\n\n`,
  )
  rl.prompt()

  for await (const line of rl) {
    const input = line.trim()
    if (!input) {
      rl.prompt()
      continue
    }
    if (input === '/exit' || input === '/quit') {
      rl.close()
      break
    }
    if (input === '/clear') {
      messages.length = 0
      lineOut.write('历史记录已清空\n')
      rl.prompt()
      continue
    }

    messages.push({ role: 'user', content: input })
    try {
      const streamParams: BetaMessageStreamParams = {
        model,
        max_tokens: 4096,
        system,
        messages,
      }

      let text: string
      if (isOpenAICompatApiMode()) {
        const ac = new AbortController()
        const tid = setTimeout(() => ac.abort(), recoveryTimeoutMs)
        try {
          const msg = await openAICompatNonStreamingRequest(
            streamParams,
            ac.signal,
          )
          text = betaMessageAssistantText(msg)
        } finally {
          clearTimeout(tid)
        }
      } else {
        const response = await anthropicClient!.messages.create({
          model,
          max_tokens: 4096,
          system,
          messages,
        })
        text = response.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n')
      }
      lineOut.write(`claude> ${text}\n\n`)
      messages.push({ role: 'assistant', content: text })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error)
      process.stderr.write(`错误：${message}\n`)
    }
    rl.prompt()
  }
}

void run().catch(error => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
