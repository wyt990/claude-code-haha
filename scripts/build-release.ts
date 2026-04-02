#!/usr/bin/env bun
/**
 * 多平台编译并打 tar 包，版本号来自 src/constants/version.ts（与运行时 MACRO.VERSION 同源）。
 *
 * 用法：
 *   bun run scripts/build-release.ts
 *   bun run scripts/build-release.ts --no-sync-package
 *   bun run scripts/build-release.ts --only windowsX64,linuxX64
 *
 * 产出：dist/releases/claudecode-{平台标识}-{版本}.tar（内含单个可执行文件）
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { CLAUDE_CODE_VERSION } from '../src/constants/version.js'

const ROOT = join(import.meta.dir, '..')
const ENTRY = join(ROOT, 'src', 'entrypoints', 'cli.tsx')
const OUT_DIR = join(ROOT, 'dist', 'releases')

type Target = {
  bunTarget: string
  /** 用于归档文件名，例如 windowsX64 → claudecode-windowsX64-1.2.3.tar */
  archiveSlug: string
  windowsExe: boolean
}

const TARGETS: Target[] = [
  { bunTarget: 'bun-linux-x64', archiveSlug: 'linuxX64', windowsExe: false },
  { bunTarget: 'bun-linux-arm64', archiveSlug: 'linuxArm64', windowsExe: false },
  { bunTarget: 'bun-linux-x64-musl', archiveSlug: 'linuxX64-musl', windowsExe: false },
  { bunTarget: 'bun-darwin-x64', archiveSlug: 'darwinX64', windowsExe: false },
  { bunTarget: 'bun-darwin-arm64', archiveSlug: 'darwinArm64', windowsExe: false },
  { bunTarget: 'bun-windows-x64', archiveSlug: 'windowsX64', windowsExe: true },
]

function fileSafeVersion(v: string): string {
  return v.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function parseArgs(argv: string[]): { noSyncPackage: boolean; only: Set<string> | null } {
  let noSyncPackage = false
  let only: Set<string> | null = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--no-sync-package') {
      noSyncPackage = true
      continue
    }
    if (a === '--only' && argv[i + 1]) {
      only = new Set(
        argv[++i]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      )
      continue
    }
    if (a.startsWith('--only=')) {
      only = new Set(
        a
          .slice('--only='.length)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      )
      continue
    }
    if (a === '-h' || a === '--help') {
      console.log(`Usage: bun run scripts/build-release.ts [options]

Options:
  --no-sync-package     Do not write package.json "version" from version.ts
  --only A,B            Build only these archiveSlug values (e.g. windowsX64,linuxX64)
  -h, --help            Show this help

Version source: src/constants/version.ts → CLAUDE_CODE_VERSION
Output: dist/releases/claudecode-<slug>-<version>.tar`)
      process.exit(0)
    }
  }
  return { noSyncPackage, only }
}

function syncPackageJson(version: string): void {
  const p = join(ROOT, 'package.json')
  const pkg = JSON.parse(readFileSync(p, 'utf8')) as { version?: string }
  if (pkg.version === version) return
  pkg.version = version
  writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log(`[build-release] package.json "version" → ${version}`)
}

function run(cmd: string[], cwd: string): void {
  const r = spawnSync(cmd[0]!, cmd.slice(1), {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })
  if (r.error) throw r.error
  if (r.status !== 0) {
    throw new Error(`Command failed (${r.status}): ${cmd.join(' ')}`)
  }
}

function main(): void {
  const { noSyncPackage, only } = parseArgs(process.argv.slice(2))
  const ver = fileSafeVersion(CLAUDE_CODE_VERSION)

  if (!noSyncPackage) {
    syncPackageJson(CLAUDE_CODE_VERSION)
  }

  if (!existsSync(ENTRY)) {
    console.error(`[build-release] Missing entry: ${ENTRY}`)
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })

  const targets = only
    ? TARGETS.filter(t => only!.has(t.archiveSlug))
    : TARGETS

  if (targets.length === 0) {
    console.error('[build-release] No targets match --only (see archiveSlug list in script).')
    process.exit(1)
  }

  console.log(
    `[build-release] CLAUDE_CODE_VERSION=${CLAUDE_CODE_VERSION} → archives *-${ver}.tar (${targets.length} target(s))`,
  )

  for (const t of targets) {
    const binaryName = t.windowsExe ? 'claudecode.exe' : 'claudecode'
    const stage = join(OUT_DIR, `_stage_${t.archiveSlug}`)
    rmSync(stage, { recursive: true, force: true })
    mkdirSync(stage, { recursive: true })
    const binaryPath = join(stage, binaryName)
    const archiveName = `claudecode-${t.archiveSlug}-${ver}.tar`
    const archivePath = join(OUT_DIR, archiveName)

    console.log(`\n[build-release] ${t.bunTarget} → ${archiveName}`)
    run(
      [
        'bun',
        'build',
        '--compile',
        join('src', 'entrypoints', 'cli.tsx'),
        '--target',
        t.bunTarget,
        '--outfile',
        binaryPath,
      ],
      ROOT,
    )

    if (!existsSync(binaryPath)) {
      console.error(`[build-release] Expected binary missing: ${binaryPath}`)
      process.exit(1)
    }

    rmSync(archivePath, { force: true })
    run(['tar', '-cf', archivePath, '-C', stage, binaryName], ROOT)
    rmSync(stage, { recursive: true, force: true })
    console.log(`[build-release] Wrote ${archivePath}`)
  }

  console.log('\n[build-release] Done.')
}

main()
