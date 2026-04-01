import { c as _c } from 'react/compiler-runtime'
import React from 'react'
import Text from '../../ink/components/Text.js'
import { translateKeyboardHintAction } from '../../utils/keyboardHintZh.js'

type Props = {
  /** The key or chord to display (e.g., "ctrl+o", "Enter", "↑/↓") */
  shortcut: string
  /** The action the key performs (English key; displayed in Chinese via translateKeyboardHintAction) */
  action: string
  /** Whether to wrap the hint in parentheses. Default: false */
  parens?: boolean
  /** Whether to render the shortcut in bold. Default: false */
  bold?: boolean
}

/**
 * Renders a keyboard shortcut hint, e.g. "esc · 中断" or "(↓ · 管理)".
 * Wrap in <Text dimColor> for the common dim styling.
 */
export function KeyboardShortcutHint(t0: Props): React.ReactNode {
  const $ = _c(9)
  const {
    shortcut,
    action,
    parens: t1,
    bold: t2,
  } = t0
  const parens = t1 === undefined ? false : t1
  const bold = t2 === undefined ? false : t2
  const actionZh = translateKeyboardHintAction(action)
  let t3
  if ($[0] !== bold || $[1] !== shortcut) {
    t3 = bold ? <Text bold={true}>{shortcut}</Text> : shortcut
    $[0] = bold
    $[1] = shortcut
    $[2] = t3
  } else {
    t3 = $[2]
  }
  const shortcutText = t3
  if (parens) {
    let t4
    if ($[3] !== actionZh || $[4] !== shortcutText) {
      t4 = (
        <Text>
          ({shortcutText} · {actionZh})
        </Text>
      )
      $[3] = actionZh
      $[4] = shortcutText
      $[5] = t4
    } else {
      t4 = $[5]
    }
    return t4
  }
  let t4
  if ($[6] !== actionZh || $[7] !== shortcutText) {
    t4 = (
      <Text>
        {shortcutText} · {actionZh}
      </Text>
    )
    $[6] = actionZh
    $[7] = shortcutText
    $[8] = t4
  } else {
    t4 = $[8]
  }
  return t4
}
