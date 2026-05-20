import React, { useCallback } from 'react'
import { logEvent } from 'src/services/analytics/index.js'
import { Box, Link, Newline, Text } from '../ink.js'
import { gracefulShutdownSync } from '../utils/gracefulShutdown.js'
import { updateSettingsForSource } from '../utils/settings/settings.js'
import { Select } from './CustomSelect/index.js'
import { Dialog } from './design-system/Dialog.js'

type Props = {
  onAccept(): void
}

export function BypassPermissionsModeDialog({
  onAccept,
}: Props): React.ReactNode {
  React.useEffect(() => {
    logEvent('tengu_bypass_permissions_mode_dialog_shown', {})
  }, [])

  function onChange(value: 'accept' | 'decline') {
    switch (value) {
      case 'accept': {
        logEvent('tengu_bypass_permissions_mode_dialog_accept', {})

        updateSettingsForSource('userSettings', {
          skipDangerousModePermissionPrompt: true,
        })
        onAccept()
        break
      }
      case 'decline': {
        gracefulShutdownSync(1)
        break
      }
    }
  }

  const handleEscape = useCallback(() => {
    gracefulShutdownSync(0)
  }, [])

  return (
    <Dialog
      title="警告：Claude Code 正以 Bypass Permissions 模式运行"
      color="error"
      onCancel={handleEscape}
    >
      <Box flexDirection="column" gap={1}>
        <Text>
          在 Bypass Permissions 模式下，Claude Code 在执行可能危险的命令前不会征求您的确认。
          <Newline />
          此模式仅应在沙箱化的容器/虚拟机中使用，且该环境应限制互联网访问，并在受损时可轻松恢复。
        </Text>
        <Text>
          继续即表示您接受在 Bypass Permissions 模式下运行期间所采取的一切行为的责任。
        </Text>

        <Text dimColor>
          <Link url="https://code.claude.com/docs/en/security">安全指南</Link>
        </Text>
      </Box>

      <Select
        options={[
          { label: '否，退出', value: 'decline' },
          { label: '是，我接受', value: 'accept' },
        ]}
        onChange={value => onChange(value as 'accept' | 'decline')}
      />
    </Dialog>
  )
}
