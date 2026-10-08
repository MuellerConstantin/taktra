import type { McpLaunchConfig } from '../../../shared/mcp'

/**
 * An assistant (MCP client) Taktra can connect itself to. Each one stores its servers in its own way,
 * so reading and writing the entry is up to the implementation.
 */
export interface Assistant {
  readonly id: string
  readonly name: string
  readonly downloadUrl: string
  readonly configPath: () => string
  readonly isInstalled: () => boolean
  /** The entry for Taktra, or `null` if there is none. */
  readonly readEntry: () => McpLaunchConfig | null
  readonly writeEntry: (config: McpLaunchConfig) => void
  readonly removeEntry: () => void
  readonly formatEntry: (config: McpLaunchConfig) => string
}
