/** Parent view state for the /plugin command flow (local stub). */
export type ViewState = string | Record<string, unknown>

export type PluginSettingsProps = {
  pluginId: string
  pluginName: string
  onBack?: () => void
}
