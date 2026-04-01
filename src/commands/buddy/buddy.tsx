import * as React from 'react'
import { useCallback, useState } from 'react'
import { getCompanion } from '../../buddy/companion.js'
import TextInput from '../../components/TextInput.js'
import type { LocalJSXCommandContext } from '../../commands.js'
import { useTerminalSize } from '../../hooks/useTerminalSize.js'
import { Box, Text, useInput } from '../../ink.js'
import type { ToolUseContext } from '../../Tool.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

type Phase = 'menu' | 'hatch'

function parseHatchLine(line: string): { name: string; personality: string } | null {
  const pipe = line.indexOf('|')
  if (pipe < 0) return null
  const name = line.slice(0, pipe).trim()
  const personality = line.slice(pipe + 1).trim()
  if (!name || !personality) return null
  return { name, personality }
}

function BuddyPanel({ onDone }: { onDone: LocalJSXCommandOnDone }) {
  const { columns } = useTerminalSize()
  const [phase, setPhase] = useState<Phase>('menu')
  const companion = getCompanion()
  const muted = getGlobalConfig().companionMuted === true

  const defaultHatch =
    companion != null
      ? `${companion.name} | ${companion.personality}`
      : '小码 | 话少但会认真看你写的每一行'

  const [hatchLine, setHatchLine] = useState(defaultHatch)
  const [hatchError, setHatchError] = useState<string | undefined>()
  const [hatchCursor, setHatchCursor] = useState(0)

  const finishExit = useCallback(() => {
    onDone(undefined, { display: 'skip' })
  }, [onDone])

  const doMute = useCallback(
    (value: boolean) => {
      saveGlobalConfig(c => ({ ...c, companionMuted: value }))
      onDone(value ? '伙伴语音已静音。' : '已取消静音。', { display: 'system' })
    },
    [onDone],
  )

  const doClear = useCallback(() => {
    saveGlobalConfig(c => {
      const next = { ...c }
      delete next.companion
      return next
    })
    onDone('已清除伙伴数据，可重新孵化。', { display: 'system' })
  }, [onDone])

  const submitHatch = useCallback(
    (line: string) => {
      const parsed = parseHatchLine(line)
      if (!parsed) {
        setHatchError('请使用：名称 | 性格（竖线两侧都要有内容）')
        return
      }
      setHatchError(undefined)
      saveGlobalConfig(c => ({
        ...c,
        companion: {
          name: parsed.name,
          personality: parsed.personality,
          hatchedAt: Date.now(),
        },
      }))
      onDone(
        `伙伴「${parsed.name}」已保存。外观与稀有度仍由你的账号哈希决定，编辑配置无法改稀有度。`,
        { display: 'system' },
      )
    },
    [onDone],
  )

  // eslint-disable-next-line custom-rules/prefer-use-keybindings -- 数字菜单与 Esc 为轻量交互，不接入全局快捷键表
  useInput(
    (input, key) => {
      if (phase !== 'menu') return
      if (key.escape) {
        finishExit()
        return
      }
      if (input === '1') {
        setPhase('hatch')
        setHatchLine(defaultHatch)
        setHatchError(undefined)
        setHatchCursor(0)
        return
      }
      if (input === '2') {
        doMute(!muted)
        return
      }
      if (input === '3' && companion) {
        doClear()
      }
    },
    { isActive: phase === 'menu' },
  )

  // eslint-disable-next-line custom-rules/prefer-use-keybindings -- 孵化页用 Ctrl+G 返回，避免与 TextInput 抢 Esc
  useInput(
    (input, key) => {
      if (phase !== 'hatch') return
      if (key.ctrl && input === 'g') {
        setPhase('menu')
        setHatchError(undefined)
      }
    },
    { isActive: phase === 'hatch' },
  )

  if (phase === 'hatch') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>孵化 / 更新伙伴</Text>
        <Text dimColor>
          格式：<Text color="cyan">名称 | 性格描述</Text>（竖线分隔）· Enter 确认 · Ctrl+G 返回菜单
        </Text>
        {hatchError != null ? (
          <Text color="error">{hatchError}</Text>
        ) : null}
        <TextInput
          value={hatchLine}
          onChange={v => {
            setHatchLine(v)
            if (hatchError != null) setHatchError(undefined)
          }}
          onSubmit={submitHatch}
          focus
          showCursor
          columns={Math.max(20, columns - 2)}
          cursorOffset={hatchCursor}
          onChangeCursorOffset={setHatchCursor}
        />
      </Box>
    )
  }

  const speciesLine =
    companion != null
      ? `物种：${companion.species} · 稀有度：${companion.rarity}`
      : '尚未孵化'

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>/buddy — 终端伙伴</Text>
      <Text>{speciesLine}</Text>
      {companion != null ? (
        <Text dimColor>
          「{companion.name}」— {companion.personality}
        </Text>
      ) : null}
      <Text dimColor>{muted ? '当前：静音' : '当前：可互动'}</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>1 孵化或更新（名称 | 性格）</Text>
        <Text>2 {muted ? '取消静音' : '静音'}</Text>
        {companion != null ? (
          <Text>3 清除伙伴</Text>
        ) : (
          <Text dimColor>3 清除伙伴（需先孵化）</Text>
        )}
      </Box>
      <Text dimColor marginTop={1}>
        Esc 退出 · 非交互：<Text color="cyan">/buddy mute</Text> ·{' '}
        <Text color="cyan">/buddy unmute</Text> · <Text color="cyan">/buddy clear</Text>
      </Text>
    </Box>
  )
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  _context: ToolUseContext & LocalJSXCommandContext,
  args: string,
): Promise<React.ReactNode> {
  const a = args.trim().toLowerCase()
  if (a === 'mute') {
    saveGlobalConfig(c => ({ ...c, companionMuted: true }))
    onDone('伙伴语音已静音。', { display: 'system' })
    return null
  }
  if (a === 'unmute') {
    saveGlobalConfig(c => ({ ...c, companionMuted: false }))
    onDone('已取消静音。', { display: 'system' })
    return null
  }
  if (a === 'clear' || a === 'reset') {
    saveGlobalConfig(c => {
      const next = { ...c }
      delete next.companion
      return next
    })
    onDone('已清除伙伴数据。', { display: 'system' })
    return null
  }
  return <BuddyPanel onDone={onDone} />
}
