import { tmpdir, userInfo } from 'node:os'
import { join } from 'node:path'

/** Per-user endpoint of the running app for MCP clients, shared with the stdio bridge. */
export function mcpPipePath(): string {
  const user = userInfo()
  return process.platform === 'win32'
    ? `\\\\.\\pipe\\taktra-mcp-${user.username}`
    : join(tmpdir(), `taktra-mcp-${user.uid}.sock`)
}
