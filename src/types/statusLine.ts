import type { AppState } from '../state/AppState.js'
import type { ModelName } from '../utils/model/model.js'
import type { Message } from './message.js'
import type { PermissionMode } from './permissions.js'
import type { VimMode } from './textInputTypes.js'

type ReadonlySettings = AppState['settings']

export type StatusLineCommandInput = {
  permissionMode: PermissionMode
  exceeds200kTokens: boolean
  settings: ReadonlySettings
  messages: Message[]
  addedDirs: string[]
  mainLoopModel: ModelName
  vimMode?: VimMode
}
