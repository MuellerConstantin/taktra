import { join } from 'node:path'
import { app } from 'electron'
import type { McpClientConfig } from '../../shared/mcp'

/** Starts the bridge with the executable of this installation, wherever it was installed to. */
export function bridgeLaunchConfig(): McpClientConfig {
  return {
    command: process.execPath,
    args: [join(app.getAppPath(), 'out', 'main', 'mcp.js')],
    env: { ELECTRON_RUN_AS_NODE: '1' }
  }
}
