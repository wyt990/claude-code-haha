# AGENTS.md — Guidelines for Agentic Coding in This Repository

## Build / Run / Test Commands

```bash
# Install dependencies
bun install

# Run interactive TUI
bun start                          # or: ./bin/claudecode
bun --env-file=.env ./src/entrypoints/cli.tsx

# Run single prompt (headless)
./bin/claudecode -p "your prompt"

# Run recovery CLI
bun --env-file=.env ./src/localRecoveryCli.ts

# TypeScript type-check (NO test runner exists in this repo)
bun run tsc --noEmit

# Build release bundle
bun run build:release

# Compile to standalone binary
bun build --compile ./src/entrypoints/cli.tsx --outfile=claudecode
```

**No test framework is configured.** There are no `*.test.ts`, `*.spec.ts`, `__tests__/`, Jest, or Vitest files. Do not attempt to write or run tests — verify correctness via `tsc --noEmit` and manual execution instead.

## Code Style & Conventions

### Imports

- **Use relative imports with `.js` extension** even for `.ts` source files:
  ```ts
  import { Foo } from './utils/foo.js'
  ```
- **`src/*` path alias** is available via tsconfig (`"src/*": ["./src/*"]`). Use sparingly; prefer relative imports.
- **External packages** use bare module names: `import sample from 'lodash-es/sample.js'`
- **Type imports** always use `import type { ... }` syntax.
- **Import order**: (1) external packages, (2) relative imports. Do NOT auto-sort — many files contain `// biome-ignore-all assist/source/organizeImports` to preserve intentional ordering.
- **Conditional imports** use `require()` inside ternary expressions guarded by feature flags. Wrap with:
  ```ts
  /* eslint-disable @typescript-eslint/no-require-imports */
  ```

### TypeScript

- **Version**: ~5.7.3, `noEmit: true` (Bun handles execution).
- **Module**: ESNext, `moduleResolution: "bundler"`.
- **JSX**: `react-jsx` (React 19).
- **Runtime validation**: Use **Zod v4** (`zod/v4`) for tool input schemas.
- **Utility types**: `type-fest` is available (e.g., `DeepImmutable<T>`).
- **No `strict: true`** in tsconfig, but write type-safe code with generics, discriminated unions, and type guards.

### Naming Conventions

| Kind | Convention | Example |
|------|-----------|---------|
| Functions | camelCase | `getTools`, `buildTool` |
| Variables | camelCase | `permissionContext`, `builtInTools` |
| Types / Interfaces | PascalCase | `Tool`, `ToolUseContext`, `Command` |
| Classes / Errors | PascalCase | `ClaudeError`, `ShellError` |
| React Components | PascalCase | `Spinner`, `BriefSpinner` |
| Constants | UPPER_SNAKE_CASE | `TOOL_PRESETS`, `TASK_ID_ALPHABET` |
| Files | camelCase or PascalCase (components) | `tools.ts`, `Spinner.tsx` |

### Error Handling

- **Custom error classes** for domain errors: `ClaudeError`, `AbortError`, `ConfigParseError`, `ShellError`, etc.
- **Normalize unknown catches** with `toError(e: unknown)` utility from `src/utils/errors.js`.
- **Check abort errors** with `isAbortError(e)`.
- **Graceful degradation**: Skills/plugins/tools that fail to load return empty arrays, never throw:
  ```ts
  getSkillDirCommands(cwd).catch(err => {
    logError(toError(err))
    return []
  })
  ```
- **Shorten stacks** for context efficiency: `shortErrorStack(e, maxFrames)`.

### Exports

- **Named exports are the default.** Use them for everything unless there's a compelling reason otherwise.
- **Default exports** are rare — only for individual command modules that get re-exported as named.
- **Re-exports** are common for breaking import cycles:
  ```ts
  export type { Command } from './types/command.js'
  export { getCommandName } from './types/command.js'
  ```
- **Tool factory**: Define tools via `ToolDef` object passed to `buildTool()` — this is the standard pattern.

### Comments

- **JSDoc** (`/** ... */`) for exported functions, types, and complex logic. Explain the "why", not the "what".
- **Single-line `//`** for inline explanations, section headers, and TODOs.
- **Code comments in English.** User-facing strings may be Chinese (this project has partial localization).
- **ESLint/Biome disable comments** must be specific, not blanket:
  ```ts
  /* eslint-disable custom-rules/no-process-env-top-level */
  // biome-ignore lint/correctness/useHookAtTopLevel: reason here
  ```

### React / Ink Components

- Components live in `src/components/` (147+ files).
- Use Ink primitives for terminal rendering (`<Box>`, `<Text>`, etc.).
- Hooks go in `src/hooks/`.
- Keep components small and focused; the codebase favors composition over large monolithic components.

## Project Structure

```
src/
  entrypoints/     CLI entry points
  components/      React/Ink UI components
  tools/           Individual tool implementations (one dir per tool)
  commands/        Slash command implementations
  services/        API clients, MCP, analytics, OAuth
  utils/           Utility functions (340+ files)
  state/           AppState store and selectors
  types/           Shared TypeScript types
  hooks/           React hooks
  skills/          Skill system
  constants/       Constants and config values
  schemas/         Zod validation schemas
```

## Key Patterns

- **Feature flags**: `feature('FLAG_NAME')` from `bun:bundle` gates optional code paths.
- **Memoization**: `lodash-es/memoize` for expensive computations (commands, tool lists).
- **Tool registry**: Tools assembled at runtime via `src/tools.ts`. Add new tools by creating a directory in `src/tools/YourTool/` and registering in `tools.ts`.
- **Command registry**: Commands assembled at runtime via `src/commands.ts`. Add commands in `src/commands/` and register.
- **Stubs**: Native/unavailable modules are stubbed in `stubs/` and mapped via tsconfig paths.
