# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Install dependencies
bun install

# Run interactive TUI mode
./bin/claude-haha

# Run headless mode (single prompt)
./bin/claude-haha -p "your prompt here"

# Run fallback Recovery CLI mode
CLAUDE_CODE_FORCE_RECOVERY_CLI=1 ./bin/claude-haha

# Windows (PowerShell/cmd)
bun --env-file=.env ./src/entrypoints/cli.tsx
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Authentication (choose one)
ANTHROPIC_API_KEY=sk-xxx
ANTHROPIC_AUTH_TOKEN=sk-xxx

# API endpoint (optional, for Anthropic-compatible gateways)
ANTHROPIC_BASE_URL=https://your-gateway.example/v1

# Model configuration
ANTHROPIC_MODEL=your-model-name
ANTHROPIC_DEFAULT_SONNET_MODEL=your-sonnet-model
ANTHROPIC_DEFAULT_HAIKU_MODEL=your-haiku-model
ANTHROPIC_DEFAULT_OPUS_MODEL=your-opus-model

# OpenAI Chat Completions compatibility mode
CLAUDE_CODE_USE_OPENAI_COMPAT_API=1  # Set to enable OpenAI-compatible gateway
```

## Architecture Overview

This is a locally-runnable version of Claude Code repaired from leaked source code, with support for Anthropic-compatible APIs (MiniMax, OpenRouter, etc.).

**Key entry points:**
- `bin/claude-haha` - Shell wrapper that invokes the CLI
- `src/entrypoints/cli.tsx` - Main CLI entry point (Commander.js + React/Ink)
- `src/main.tsx` - TUI main logic
- `src/localRecoveryCli.ts` - Fallback readline-based CLI

**Core directories:**
- `src/ink/` - Ink terminal rendering engine
- `src/components/` - UI components
- `src/tools/` - Agent tools (Bash, Edit, Grep, Glob, etc.)
- `src/commands/` - Slash commands (/commit, /review, etc.)
- `src/services/` - API client, MCP, OAuth
- `src/services/api/openaiCompat/` - OpenAI Chat Completions compatibility layer
- `src/skills/` - Skill system
- `src/hooks/` - React hooks
- `src/utils/` - Utilities including `anthropicBaseUrl.ts` for endpoint normalization

**Key configuration files:**
- `preload.ts` - Bun preload script (sets `MACRO` globals, env normalizations)
- `bunfig.toml` - Bun configuration
- `tsconfig.json` - TypeScript paths (maps `src/*` and stubs for native modules)
- `stubs/` - Stub files for native modules (`color-diff-napi`, `modifiers-napi`)

**OpenAI Compatibility Mode:**
When `CLAUDE_CODE_USE_OPENAI_COMPAT_API=1`, requests route through `src/services/api/openaiCompat/` which converts Anthropic Messages API params to OpenAI Chat Completions format and transforms SSE responses back to Anthropic stream events. See `docs/OpenAI 兼容 API 接入方案.md` for full architecture details.

## Common Operations

**Run a specific test (if tests exist):**
```bash
bun test path/to/test.ts
```

**Check TypeScript:**
```bash
bun run tsc --noEmit
```

**Add a new tool:**
1. Create tool class in `src/tools/YourTool/`
2. Register in `src/tools.ts`

**Modify slash commands:**
- Command definitions in `src/commands.ts`
- Individual command implementations in `src/commands/`

**API client modifications:**
- Main Anthropic client: `src/services/api/claude.ts`
- OpenAI compatibility layer: `src/services/api/openaiCompat/`
- Endpoint normalization: `src/utils/anthropicBaseUrl.ts`
