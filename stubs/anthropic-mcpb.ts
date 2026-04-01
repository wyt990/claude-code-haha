/* eslint-disable @typescript-eslint/no-explicit-any */
export type McpbManifest = Record<string, any>
export type McpbUserConfigurationOption = Record<string, any>

export const McpbManifestSchema = {
  safeParse(value: unknown) {
    return { success: true as const, data: value as McpbManifest }
  },
}

/** Minimal MCP server config for typecheck; real impl lives in `@anthropic-ai/mcpb`. */
export async function getMcpConfigForManifest(_args: {
  manifest: McpbManifest
  extensionPath: string
  systemDirs: unknown
  userConfig: Record<string, unknown>
  pathSeparator: string
}): Promise<Record<string, unknown>> {
  return {
    type: 'stdio',
    command: 'true',
    args: [],
    scope: 'user',
  }
}
