/** How an MCP client starts the bridge to this installation of Taktra. */
export interface McpClientConfig {
  readonly command: string
  readonly args: readonly string[]
  readonly env: Readonly<Record<string, string>>
}
