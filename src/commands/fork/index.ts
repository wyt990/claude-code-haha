import type { Command } from '../../types/command.js'

const forkCommand: Command = {
  type: 'local-jsx',
  name: 'fork',
  description: '',
  isEnabled: () => false,
  load: async () => ({
    call: async (_onDone, _context, _args) => null,
  }),
}

export default forkCommand
