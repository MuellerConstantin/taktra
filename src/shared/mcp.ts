/** Name under which Taktra appears in the configuration of MCP clients. */
export const MCP_SERVER_NAME = 'taktra'

/** How an MCP client starts the bridge to this installation of Taktra. */
export interface McpClientConfig {
  readonly command: string
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
}

/**
 * `outdated`: the client has an entry for Taktra that starts another installation, e.g. after
 * Taktra was moved. `invalid`: its configuration cannot be read, so Taktra leaves it alone.
 */
export type McpClientState = 'notInstalled' | 'disconnected' | 'connected' | 'outdated' | 'invalid'

export interface McpClientStatus {
  readonly id: string
  readonly name: string
  readonly downloadUrl: string
  readonly state: McpClientState
  readonly configPath: string
  /** What connecting adds to the configuration, for setting it up by hand. */
  readonly manualEntry: string
}
