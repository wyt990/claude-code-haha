# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。

## 工程协作四原则

### 1. 先想后写（Think Before Coding）
**不要假设，不要藏着疑惑，把取舍摆出来。**
动手之前：- 明确说出你的假设，如果不确定，就问。- 如果存在多种理解，把它们列出来，不要自己悄悄选一个。- 如果有更简单的方案，说出来，推一下。- 如果有什么搞不清楚，停下来，说清楚哪里不明白，再问。

### 2. 能简则简（Simplicity First）
**用最少的代码解决问题，不做多余的事。**
- 不加用户没要求的功能。- 不为一次性逻辑搭抽象层。- 不预加"灵活性"或"可配置性"。
- 不为不可能发生的场景写错误处理。- 如果写了 200 行但 50 行够用，重写。
自检标准：一个高级工程师看了会觉得过度设计吗？如果会，简化。

### 3. 精准修改（Surgical Changes）
**只动你该动的地方，只清理你自己制造的烂摊子。**
修改已有代码时：- 不要"顺手优化"旁边的代码、注释或格式。
- 不要重构没有问题的逻辑。- 保持原有风格，即使你觉得可以写得更好。- 发现不相关的死代码，提一句，不要擅自删。当你的改动制造了孤儿代码时：- 清掉你的改动造成的多余 import、变量、函数。
- 原来就有的死代码，不要动，除非被要求。检验标准：每一处改动都能直接追溯到用户的请求。

### 4. 目标驱动执行（Goal-Driven Execution）
**定义成功标准，循环直到验证通过。**
把指令转化成可验证的目标：- "加一个校验" → "先写覆盖非法输入的测试，再让测试通过"
- "修这个 bug" → "先写能复现 bug 的测试，再修"
- "重构 X" → "确保重构前后测试都通过"
多步骤任务，列出简要计划：
1. [步骤] → 验证：[检查项]
2. [步骤] → 验证：[检查项]
3. [步骤] → 验证：[检查项]

## 构建与运行

```bash
# 安装依赖
bun install

# 运行交互式 TUI 模式
./bin/claudecode
# 或
bun --env-file=.env ./src/entrypoints/cli.tsx

# 运行无头模式（单个提示词）
./bin/claudecode -p "你的提示词"

# 运行降级 Recovery CLI 模式
CLAUDE_CODE_FORCE_RECOVERY_CLI=1 ./bin/claudecode
# 或直接
bun --env-file=.env ./src/localRecoveryCli.ts

# Windows (PowerShell/cmd)
bun --env-file=.env ./src/entrypoints/cli.tsx
```

## 环境配置

复制 `.env.example` 到 `.env` 并配置：

```env
# 认证（二选一）
ANTHROPIC_API_KEY=sk-xxx
ANTHROPIC_AUTH_TOKEN=sk-xxx

# API 端点（可选，用于 Anthropic 兼容网关）
ANTHROPIC_BASE_URL=https://your-gateway.example/v1

# 模型配置
ANTHROPIC_MODEL=your-model-name
ANTHROPIC_DEFAULT_SONNET_MODEL=your-sonnet-model
ANTHROPIC_DEFAULT_HAIKU_MODEL=your-haiku-model
ANTHROPIC_DEFAULT_OPUS_MODEL=your-opus-model

# OpenAI Chat Completions 兼容模式
CLAUDE_CODE_USE_OPENAI_COMPAT_API=1  # 设置为启用 OpenAI 兼容网关
```

## 架构概述

这是一个从泄露源码修复的本地可运行版 Claude Code，支持 Anthropic 兼容 API（MiniMax、OpenRouter 等）。

**关键入口点：**
- `bin/claudecode` - 调用 CLI 的 Shell 包装脚本
- `src/entrypoints/cli.tsx` - 主 CLI 入口（Commander.js + React/Ink）
- `src/localRecoveryCli.ts` - 降级 readline CLI

**核心目录：**
- `src/ink/` - Ink 终端渲染引擎
- `src/components/` - UI 组件
- `src/tools/` - Agent 工具（Bash、Edit、Grep、Glob 等）
- `src/commands/` - 斜杠命令（/commit、/review 等）
- `src/services/` - API 客户端、MCP、OAuth
- `src/services/api/openaiCompat/` - OpenAI Chat Completions 兼容层
- `src/skills/` - Skill 系统
- `src/hooks/` - React hooks
- `src/utils/` - 工具函数，包括 `anthropicBaseUrl.ts` 用于端点规范化

**关键配置文件：**
- `preload.ts` - Bun preload 脚本，执行以下初始化：
  - 设置 `MACRO` 全局变量（VERSION、PACKAGE_URL、BUILD_TIME 等，在 `bun build --compile` 时内联）
  - 调用 `anthropicBaseUrl.ts` 规范化 `ANTHROPIC_BASE_URL`（处理 `/v1` 末尾）
  - 从 `CLAUDE_CODE_INSTALL_PREFIX` 目录加载 `.env`（Release 安装场景）
  - 后台预取 OpenCode Zen 免费模型列表
- `bunfig.toml` - Bun 配置（preload 入口）
- `tsconfig.json` - TypeScript 路径映射（`src/*` + native 模块 stubs）
- `stubs/` - Native 模块桩文件，替换无法在本地运行的原生扩展：
  - `color-diff-napi.ts`、`modifiers-napi.ts` - 终端颜色/按键修饰检测
  - `audio-capture-napi.ts`、`image-processor-napi.ts` - 语音输入/图像处理（Windows/Linux 不完整支持）
  - `sharp.ts`、`turndown.ts` 等 - 图片转换/HTML 解析工具

**OpenAI 兼容模式：**
当 `CLAUDE_CODE_USE_OPENAI_COMPAT_API=1` 时，请求通过 `src/services/api/openaiCompat/` 路由，该模块将 Anthropic Messages API 参数转换为 OpenAI Chat Completions 格式，并将 SSE 响应转换回 Anthropic 流事件。完整架构详情见 `docs/OpenAI 兼容 API 接入方案.md`。

**请求生命周期（简化）：**
```
用户输入 → PromptInput → handleEnter() → Agent 循环
  → queryModel (claude.ts) → API 请求
  → 流式响应 → 解析为 StreamEvent
  → 更新 UI 组件 (Ink 渲染)
```

**核心服务层：**
- `src/services/api/claude.ts` - 主 API 客户端，处理消息流、工具调用、重试逻辑
- `src/services/api/client.ts` - 客户端工厂（`getAnthropicClient`）
- `src/services/mcp/` - MCP 服务器管理（资源发现、调用）
- `src/services/oauth/` - OAuth 认证（Anthropic、GitHub 等）
- `src/utils/model/providers.ts` - 模型提供商检测（Anthropic/Bedrock/Vertex/自定义）

## 常用操作

**TypeScript 类型检查：**
```bash
bun run tsc --noEmit
```

**测试与 Lint：**
- 本项目无单元测试框架，package.json 中无 `test` 脚本
- 无 ESLint/Prettier 配置，代码风格由 TypeScript 严格模式保证

**添加新工具：**
1. 在 `src/tools/YourTool/` 中创建工具类
2. 在 `src/tools.ts` 中注册

**修改斜杠命令：**
- 命令定义在 `src/commands.ts`
- 单独命令实现在 `src/commands/`

**API 客户端修改：**
- 主 Anthropic 客户端：`src/services/api/claude.ts`
- OpenAI 兼容层：`src/services/api/openaiCompat/`
- 端点规范化：`src/utils/anthropicBaseUrl.ts`

**Feature Flags 与条件编译：**
代码库中大量使用 `feature()` 函数（来自 `bun:bundle`）进行条件导入和逻辑分支，例如：
- `feature('PROACTIVE')` / `feature('KAIROS')` - Proactive 功能和 Kairos 模式
- `feature('AGENT_TRIGGERS')` - Agent 触发器（Cron 任务）
- `feature('VOICE_MODE')` - 语音模式
- `feature('BRIDGE_MODE')` - Bridge 模式（远程连接）

这些 flag 在构建时被 Tree-shaking，不会出现在外部构建产物中。开发时通过环境变量控制（如 `USER_TYPE=ant`）。

## 打包为独立可执行文件

使用 Bun 的 `--compile` 选项将应用打包为单个可执行文件：

```bash
# 本机构建（当前平台）
bun build --compile ./src/entrypoints/cli.tsx --outfile=claudecode

# 交叉编译示例
bun build --compile ./src/entrypoints/cli.tsx --outfile=claudecode.exe --target=bun-windows-x64
bun build --compile ./src/entrypoints/cli.tsx --outfile=claudecode --target=bun-linux-x64-musl
```

详见 README.md 中「编译为独立可执行文件」章节。

## 汉化说明

本项目已进行部分汉化，主要包括：

### 已完成的汉化

1. **Recovery CLI 界面** (`src/localRecoveryCli.ts`)
   - 帮助信息和交互提示已汉化

2. **斜杠命令描述** - 以下命令描述已汉化：
   - 基础命令：/help、/clear、/exit、/version
   - 配置命令：/model、/config、/mcp、/hooks、/memory、/permissions
   - 任务命令：/skills、/tasks、/files
   - 开发命令：/commit、/review、/diff、/branch、/add-dir
   - 状态命令：/status、/cost、/doctor、/context、/plan
   - 账户命令：/login、/logout、/feedback
   - 其他命令：/compact、/init、/export、/agents

3. **Spinner 加载状态** (`src/constants/spinnerVerbs.ts`)
   - 加载状态动词列表已汉化为中文

4. **权限请求通知** (`src/components/permissions/PermissionRequest.tsx`)
   - 权限请求通知消息已汉化

5. **CLAUDE.md** - 本项目文档已汉化

### 汉化模式

- `/model`、`/init` 等命令名称保持原样（不翻译），但命令描述和解释使用中文
- 用户可见的界面文本、帮助信息、错误消息使用中文
- 代码注释、变量名、技术术语保持英文

### 待完成的汉化

如需继续汉化，按以下优先级进行：

1. **高优先级** - TUI 界面核心组件：
   - `src/components/PromptInput/` - 输入框提示和状态
   - `src/components/Spinner.tsx` - 加载状态组件
   - 其他权限请求组件

2. **中优先级** - 工具提示和错误消息：
   - `src/tools/` - 各工具的进度消息和错误提示
   - `src/utils/errors.ts` - 错误消息

3. **低优先级** - 其他 UI 组件：
   - `src/components/` 下的其他对话框和提示组件
