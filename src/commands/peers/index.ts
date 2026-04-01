import type { Command } from '../../types/command.js'

const peersCommand: Command = {
  type: 'local-jsx',
  name: 'peers',
  description: '',
  isEnabled: () => false,
  load: async () => ({
    call: async (_onDone, _context, _args) => null,
  }),
}

export default peersCommand
