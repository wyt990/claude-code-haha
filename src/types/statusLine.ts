import type { AppState } from '../state/AppState.js'
import type { ModelName } from '../utils/model/model.js'
import type { Message } from './message.js'
import type { PermissionMode } from './permissions.js'
import type { VimMode } from './textInputTypes.js'

type ReadonlySettings = AppState['settings']

export type StatusLineCommandInput = {
  // Required fields from base hook input
  session_id: string
  transcript_path: string
  cwd: string
  // Original required fields
  permissionMode?: PermissionMode
  exceeds200kTokens?: boolean
  settings?: ReadonlySettings
  messages?: Message[]
  addedDirs?: string[]
  mainLoopModel?: ModelName
  vimMode?: VimMode
  // Extended fields from createBaseHookInput and additional properties
  session_name?: string
  model?: {
    id: string
    display_name: string
  }
  workspace?: {
    current_dir: string
    project_dir: string
    added_dirs: string[]
  }
  version?: string
  output_style?: {
    name: string
  }
  cost?: {
    total_cost_usd: number
    total_duration_ms: number
    total_api_duration_ms: number
    total_lines_added: number
    total_lines_removed: number
  }
  context_window?: {
    total_input_tokens: number
    total_output_tokens: number
    context_window_size: number
    current_usage: unknown
    used_percentage: number
    remaining_percentage: number
  }
  exceeds_200k_tokens?: boolean
  rate_limits?: {
    five_hour?: {
      used_percentage: number
      resets_at: string | number
    }
    seven_day?: {
      used_percentage: number
      resets_at: string | number
    }
  }
  vim?: {
    mode: string
  }
  agent?: {
    name: string
  }
  remote?: {
    session_id: string
  }
  worktree?: {
    name: string
    path: string
    branch?: string
    original_cwd?: string
    original_branch?: string
  }
  // From createBaseHookInput
  permission_mode?: string
  agent_id?: string
  agent_type?: string
}
