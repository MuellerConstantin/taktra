/** Name under which Taktra appears in the configuration of assistants. */
export const MCP_SERVER_NAME = 'taktra'

/** How an MCP client starts the bridge to this installation of Taktra. */
export interface McpLaunchConfig {
  readonly command: string
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
}

/**
 * `outdated`: the assistant has an entry for Taktra that starts another installation, e.g. after
 * Taktra was moved. `invalid`: its configuration cannot be read, so Taktra leaves it alone.
 */
export type AssistantState = 'notInstalled' | 'disconnected' | 'connected' | 'outdated' | 'invalid'

export interface AssistantStatus {
  readonly id: string
  readonly name: string
  readonly downloadUrl: string
  readonly state: AssistantState
  readonly configPath: string
  /** What connecting adds to the configuration, for setting it up by hand. */
  readonly manualEntry: string
}
