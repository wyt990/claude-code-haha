import { c as _c } from 'react/compiler-runtime'
import * as React from 'react'
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js'
import { Box, Text } from '../../ink.js'

type Props = {
  instructions?: string
}

const DEFAULT_INSTRUCTIONS =
  '↑↓ 移动 · Enter 选择 · Esc 返回'

export function AgentNavigationFooter(t0: Props): React.ReactNode {
  const $ = _c(2)
  const {
    instructions: t1,
  } = t0
  const instructions = t1 === undefined ? DEFAULT_INSTRUCTIONS : t1
  const exitState = useExitOnCtrlCDWithKeybindings()
  const t2 = exitState.pending
    ? `再按一次 ${exitState.keyName} 退出`
    : instructions
  let t3
  if ($[0] !== t2) {
    t3 = (
      <Box marginLeft={2}>
        <Text dimColor={true}>{t2}</Text>
      </Box>
    )
    $[0] = t2
    $[1] = t3
  } else {
    t3 = $[1]
  }
  return t3
}
