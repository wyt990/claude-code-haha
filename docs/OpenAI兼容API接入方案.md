# OpenAI 兼容 API 接入方案

本文档说明在本项目中增加 **OpenAI Chat Completions**（含流式 SSE）分支的目标架构、与现有 Anthropic Messages API 的差异、分阶段任务清单及风险。实现代码位于 `src/services/api/openaiCompat/`。

---

## 1. 背景与目标

### 1.1 现状

- 主对话链路在 `src/services/api/claude.ts` 的 `queryModel` 中调用 **`anthropic.beta.messages.create({ stream: true })`**，消费 **`BetaRawMessageStreamEvent`**（`message_start` / `content_block_*` / `message_delta` / `message_stop`）。
- 非流式兜底在 `executeNonStreamingRequest` 中同样走 **Anthropic Messages API**。
- `getAnthropicClient`（`src/services/api/client.ts`）面向 Anthropic SDK。

### 1.2 目标

在 **不替换整套 UI 与工具管线** 的前提下，通过 **协议适配层** 将 OpenAI 兼容网关的：

- 请求：`POST /v1/chat/completions`（JSON 体为 OpenAI 格式）  
- 响应：SSE `data: {...}` 流式 chunk  

转换为与现有逻辑一致的 **Anthropic 流事件序列**，使 `queryModel` 内 `for await (const part of stream)` **尽量无需分支**。

### 1.3 环境变量（约定）

| 变量 | 说明 |
|------|------|
| `CLAUDE_CODE_USE_OPENAI_COMPAT_API` | 设为 `1` / `true` / `yes` / `on` 时启用 **OpenAI Chat Completions** 分支（本方案主体） |
| `CLAUDE_CODE_OPENAI_COMPATIBLE_API` | **另一开关**：仅规范化 `ANTHROPIC_BASE_URL` 末尾 `/v1`，用于仍走 **Anthropic Messages** 的网关（见 `src/utils/anthropicBaseUrl.ts`），与上一项勿混淆 |
| `ANTHROPIC_BASE_URL` 或 `CLAUDE_CODE_OPENAI_BASE_URL` | OpenAI 网关根地址；若以 `/v1` 结尾则请求 `${base}/chat/completions`，否则为 `${base}/v1/chat/completions` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` | 与现有逻辑一致：Key 或 Bearer |
| `CLAUDE_CODE_OPENAI_EXTRA_BODY` | （可选）合法 JSON 对象，合并进 Chat Completions 请求体 |

**互斥**：启用 `CLAUDE_CODE_USE_OPENAI_COMPAT_API` 时，不应同时启用 Bedrock / Vertex / Foundry；`queryModel` 会在运行时检测并返回错误提示（见 `claude.ts`）。

---

## 2. 协议差异摘要

| 维度 | Anthropic Messages | OpenAI Chat Completions |
|------|--------------------|-------------------------|
| 端点 | `/v1/messages` | `/v1/chat/completions` |
| 系统提示 | `system` 字段（字符串或块数组） | 通常为首条 `role: "system"` |
| 多模态 | 自定义 content block | `content` 为 part 数组（`text` / `image_url` 等） |
| 工具定义 | `tools` + `tool_choice` | `tools`（`type: function`）+ `tool_choice` |
| 工具结果 | `user` 消息内 `tool_result` 块 | `role: "tool"` + `tool_call_id` |
| 流格式 | Anthropic SSE 事件类型 | `choices[0].delta` 累积 |
| 用量字段 | `usage` 与 `message_delta` | 常在最后一个 chunk 的 `usage` |

适配层职责：**请求侧** 将 `BetaMessageStreamParams`（在 `paramsFromContext` 产出）中可映射子集转为 OpenAI body；**响应侧** 将 OpenAI chunk 转为合成 `BetaRawMessageStreamEvent`。

---

## 3. 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│ queryModel (claude.ts)                                       │
│   paramsFromContext → BetaMessageStreamParams（不变）         │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │ isOpenAICompatApiMode()           │
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────────────┐
│ Anthropic SDK        │           │ openaiCompat/                │
│ beta.messages.create │           │ fetch + SSE 解析             │
│ Stream               │           │ → new Stream(iterator,…)   │
└─────────────────────┘           └─────────────────────────────┘
```

- **原则**：尽量在 `openaiCompat` 内完成转换，`claude.ts` 仅增加 **分支选择与 `Stream` 构造**，避免复制 `content_block_*` 状态机。

---

## 4. 分阶段任务清单

### 阶段 A — 基础能力（当前实现范围）

| ID | 任务 | 状态 | 说明 |
|----|------|------|------|
| A1 | 环境检测与 Base URL 解析 | 已完成 | `openaiCompat/config.ts`：`isOpenAICompatApiMode`、`getOpenAIChatCompletionsUrl` |
| A2 | Anthropic 参数 → OpenAI 请求体 | 已完成 | `anthropicParamsToOpenAI.ts`：system、messages、tools、tool_choice、`max_tokens`、`stream` |
| A3 | OpenAI SSE → 合成 Anthropic 流事件 | 已完成 | `openaiChatStream.ts`：文本增量、`tool_calls` 增量、`finish_reason` → `stop_reason` |
| A4 | 接入 `queryModel` 主路径 | 已完成 | `claude.ts` 内 `withRetry` 回调：OpenAI 模式走 `fetch` + `Stream` |
| A5 | 流失败后的兜底 | 已演进 | 阶段 B 起：OpenAI 模式下流失败可走 **`openAICompatNonStreamingRequest`**（仍不调 Anthropic） |
| A6 | 配置示例 | 已完成 | `.env.example` 注释 |

**实现文件（阶段 A）**：`openaiCompat/config.ts`、`anthropicParamsToOpenAI.ts`、`openaiChatStream.ts`；接入点 `claude.ts` 中 `queryModel` 的 `withRetry` 回调与 `disableFallback` 条件。

### 阶段 B — 健壮性与覆盖率

| ID | 任务 | 状态 | 说明 |
|----|------|------|------|
| B1 | OpenAI 非流式兜底 | 已完成 | `executeNonStreamingRequest` 在 OpenAI 模式下调用 `openaiNonStreaming.ts`；`queryModel` 恢复允许非流式兜底（不再全局 `disableFallback`） |
| B2 | 多模态 user 消息 | 已完成 | 维持 `image` base64/url；**`document` 块**在 `assertOpenAICompatMessagesSupported` 中显式报错 |
| B3 | `server_tool_use` / Advisor / 特殊工具 | 已完成 | 助手侧跳过 `server_tool_use` / `mcp_tool_use` / thinking 块；工具列表过滤 `tool_search` / `web_search` / `code_execution` / `mcp_toolset` 等非标准 function 工具 |
| B4 | 扩展请求体 | 已完成 | 环境变量 **`CLAUDE_CODE_OPENAI_EXTRA_BODY`**（JSON 对象）经 `extraBody.ts` 合并进请求（不覆盖 `model` / `messages` / `stream`） |
| B5 | Token 计数 API | 已完成 | `countMessagesTokensWithAPI` 在 OpenAI 模式下使用字符启发式 `roughEstimateInputTokensForOpenAICompat` |
| B6 | `localRecoveryCli` | 已完成 | `-p` 与交互模式在 OpenAI 兼容开关下走 `openAICompatNonStreamingRequest` |

### 阶段 C — 质量与运维

| ID | 任务 | 状态 | 说明 |
|----|------|------|------|
| C1 | 单元测试：URL 与 JSON 转换 | 待办 | 固定 fixture 对比 OpenAI body |
| C2 | 集成测试：Mock SSE | 待办 | 验证 `message_start` → `content_block_stop` → `message_delta` 顺序 |
| C3 | 错误映射 | 待办 | HTTP 4xx/5xx JSON → `APIError`，与 `errors.ts` 分类对齐 |
| C4 | 遥测与日志 | 待办 | 标记 `provider: openai_compat`，避免与官方 Anthropic 指标混淆 |

---

## 5. 关键文件映射

| 路径 | 职责 |
|------|------|
| `src/services/api/openaiCompat/config.ts` | 开关、URL、鉴权头 |
| `src/services/api/openaiCompat/anthropicParamsToOpenAI.ts` | 请求体转换 |
| `src/services/api/openaiCompat/openaiChatStream.ts` | SSE 解析与 `Stream` 包装 |
| `src/services/api/openaiCompat/openaiNonStreaming.ts` | 非流式 `chat/completions` → `BetaMessage` |
| `src/services/api/openaiCompat/openaiResponseToBetaMessage.ts` | OpenAI 响应 JSON → `BetaMessage` |
| `src/services/api/openaiCompat/extraBody.ts` | `CLAUDE_CODE_OPENAI_EXTRA_BODY` 合并 |
| `src/services/api/claude.ts` | `queryModel` 分支、`disableFallback` 条件 |
| `src/utils/anthropicBaseUrl.ts` | 与 `CLAUDE_CODE_OPENAI_COMPATIBLE_API` 的 `/v1` 去重（Anthropic 模式）；OpenAI 模式使用独立 URL 规则 |

---

## 6. 风险与限制

1. **工具与 JSON**：OpenAI 流式 `tool_calls[].function.arguments` 为字符串片段，需累积后与 Anthropic `input_json_delta` 行为对齐；畸形 JSON 依赖网关与模型。
2. **分块顺序**：部分网关先返回 `tool_calls` 再返回文本，适配层需按索引维护多个并行块，保证发出的 `content_block` 索引与 `claude.ts` 状态机一致。
3. **空助手消息**：仅 `tool_calls` 无 `content` 时须正确发出 `tool_use` 块，避免 `content_block_stop` 与 `normalizeContentFromAPI` 异常。
4. **用量与计费**：OpenAI 兼容实现可能不返回 `usage`；`message_delta` 中 usage 可能为 0，影响成本统计准确性。
5. **合规**：使用第三方聚合网关时需注意数据驻留与条款；本文档不讨论供应商合规。

---

## 7. 验证建议

1. 配置 `CLAUDE_CODE_USE_OPENAI_COMPAT_API=true` 与 `ANTHROPIC_BASE_URL=https://<网关>/v1`。  
2. 先测 **纯文本** 对话，再测 **单次工具调用**，再测 **多工具**。  
3. 若流异常结束，检查网关日志中 `finish_reason` 与是否返回标准 SSE。  
4. 与 Anthropic 官方路径对比同提示下的工具调用是否一致（允许模型差异）。

---

## 8. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-04-01 | 初版：架构、任务清单、阶段 A 实现索引 |
| 2026-04-01 | 阶段 A 落地：OpenAI SSE → 合成 Anthropic 流事件；`claude.ts` 接入；区分 `CLAUDE_CODE_OPENAI_COMPATIBLE_API` 与 `CLAUDE_CODE_USE_OPENAI_COMPAT_API` |
| 2026-04-01 | 阶段 B：非流式兜底、`CLAUDE_CODE_OPENAI_EXTRA_BODY`、文档块校验、工具/块过滤、token 启发式、`localRecoveryCli` 接入 |
