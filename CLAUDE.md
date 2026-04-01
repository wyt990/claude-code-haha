# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作提供指导。

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
- `preload.ts` - Bun preload 脚本（设置 `MACRO` 全局变量、环境变量规范化）
- `bunfig.toml` - Bun 配置
- `tsconfig.json` - TypeScript 路径（映射 `src/*` 和 native 模块 stubs）
- `stubs/` - Native 模块桩文件（`color-diff-napi`、`modifiers-napi`）

**OpenAI 兼容模式：**
当 `CLAUDE_CODE_USE_OPENAI_COMPAT_API=1` 时，请求通过 `src/services/api/openaiCompat/` 路由，该模块将 Anthropic Messages API 参数转换为 OpenAI Chat Completions 格式，并将 SSE 响应转换回 Anthropic 流事件。完整架构详情见 `docs/OpenAI 兼容 API 接入方案.md`。

## 常用操作

**TypeScript 类型检查：**
```bash
bun run tsc --noEmit
```

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
