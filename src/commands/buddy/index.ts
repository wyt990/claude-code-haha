import type { Command } from '../../commands.js'

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: '管理终端伙伴（孵化、静音、清除）',
  argumentHint: '[mute|unmute|clear]',
  load: () => import('./buddy.js'),
} satisfies Command

export default buddy
