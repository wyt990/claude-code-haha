// highlight.js's type defs carry `/// <reference lib="dom" />`. SSETransport,
// mcp/client, ssh, dumpPrompts use DOM types (TextDecodeOptions, RequestInfo)
// that only typecheck because this file's `typeof import('highlight.js')` pulls
// lib.dom in. tsconfig has lib: ["ESNext"] only — fixing the actual DOM-type
// deps is a separate sweep; this ref preserves the status quo.
/// <reference lib="dom" />

import type { HLJSApi } from 'highlight.js'
import { extname } from 'path'

export type CliHighlight = {
  highlight: (code: string, options: { language: string }) => string
  supportsLanguage: (lang: string) => boolean
}

// One promise shared by Fallback.tsx, markdown.ts, events.ts, getLanguageName.
// The highlight.js import piggybacks: cli-highlight has already pulled it into
// the module cache, so the second import() is a cache hit — no extra bytes
// faulted in.
let cliHighlightPromise: Promise<CliHighlight | null> | undefined

let loadedGetLanguage: HLJSApi['getLanguage'] | undefined

function supportsLanguageFromHighlightJs(
  getLanguage: HLJSApi['getLanguage'],
): (lang: string) => boolean {
  return (lang: string) => {
    const t = typeof lang === 'string' ? lang.trim() : ''
    if (!t) return false
    return Boolean(getLanguage(t))
  }
}

async function loadCliHighlight(): Promise<CliHighlight | null> {
  try {
    const cliHighlightMod = await import('cli-highlight')
    const cliHighlight = cliHighlightMod as typeof cliHighlightMod & {
      default?: typeof cliHighlightMod
    }
    const ns = cliHighlight.default ?? cliHighlight
    // cache hit — cli-highlight (or stub) already pulled highlight.js
    const highlightJsMod = await import('highlight.js')
    const hljs: HLJSApi = highlightJsMod.default
    loadedGetLanguage = hljs.getLanguage

    const hl =
      typeof ns.highlight === 'function'
        ? ns.highlight
        : typeof cliHighlightMod.highlight === 'function'
          ? cliHighlightMod.highlight
          : null
    if (!hl) {
      return null
    }

    const fromPkg = ns.supportsLanguage ?? cliHighlightMod.supportsLanguage
    const supportsLanguage =
      typeof fromPkg === 'function'
        ? (lang: string) => (fromPkg as (l: string) => boolean)(lang)
        : supportsLanguageFromHighlightJs(hljs.getLanguage)

    return {
      highlight: hl as CliHighlight['highlight'],
      supportsLanguage,
    }
  } catch {
    return null
  }
}

export function getCliHighlightPromise(): Promise<CliHighlight | null> {
  cliHighlightPromise ??= loadCliHighlight()
  return cliHighlightPromise
}

/**
 * eg. "foo/bar.ts" → "TypeScript". Awaits the shared cli-highlight load,
 * then reads highlight.js's language registry. All callers are telemetry
 * (OTel counter attributes, permission-dialog unary events) — none block
 * on this, they fire-and-forget or the consumer already handles Promise<string>.
 */
export async function getLanguageName(file_path: string): Promise<string> {
  await getCliHighlightPromise()
  const ext = extname(file_path).slice(1)
  if (!ext) return 'unknown'
  return loadedGetLanguage?.(ext)?.name ?? 'unknown'
}
