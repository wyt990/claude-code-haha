/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AgentDefinition } from '../../../tools/AgentTool/loadAgentsDir.js'
import type { SettingSource } from '../../../utils/settings/constants.js'

export interface AgentWizardData {
  location?: SettingSource
  finalAgent?: AgentDefinition
  agentType?: string
  whenToUse?: string
  memory?: string
  tools?: string[]
  model?: string
  [key: string]: any
}
