import type { Command } from '../../types/command.js'

/** Feature-gated stub — real workflows command not in this tree. */
const workflowsCommand: Command = {
  type: 'local-jsx',
  name: 'workflows',
  description: '',
  isEnabled: () => false,
  load: async () => ({
    call: async (_onDone, _context, _args) => null,
  }),
}

export default workflowsCommand
