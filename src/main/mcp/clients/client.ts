import type { McpClientConfig } from '../../../shared/mcp'

/**
 * An MCP client Taktra can connect itself to. Each client stores its servers in its own way,
 * so reading and writing the entry is up to the implementation.
 */
export interface McpClient {
  readonly id: string
  readonly name: string
  readonly downloadUrl: string
  readonly configPath: () => string
  readonly isInstalled: () => boolean
  /** The entry for Taktra, or `null` if there is none. */
  readonly readEntry: () => McpClientConfig | null
  readonly writeEntry: (config: McpClientConfig) => void
  readonly removeEntry: () => void
  readonly formatEntry: (config: McpClientConfig) => string
}
