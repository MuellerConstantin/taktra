import { homedir } from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'
import { z } from 'zod'
import { AppError, isAppError } from '../../../shared/errors'
import type { McpClientConfig, McpClientState, McpClientStatus } from '../../../shared/mcp'
import { handle } from '../../ipc'
import { bridgeLaunchConfig } from '../launch'
import type { McpClient } from './client'
import { jsonConfigClient } from './jsonConfigClient'

const CLAUDE_DOWNLOAD_URL = 'https://claude.ai/download'

const claudeDesktopDir = (): string => join(app.getPath('appData'), 'Claude')

const claudeCodeDir = (): string => process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')

const clients: readonly McpClient[] = [
  jsonConfigClient({
    id: 'claudeDesktop',
    name: 'Claude Desktop',
    downloadUrl: CLAUDE_DOWNLOAD_URL,
    installDir: claudeDesktopDir,
    configPath: () => join(claudeDesktopDir(), 'claude_desktop_config.json'),
    serversKey: 'mcpServers'
  }),
  jsonConfigClient({
    id: 'claudeCode',
    name: 'Claude Code',
    downloadUrl: CLAUDE_DOWNLOAD_URL,
    installDir: claudeCodeDir,
    configPath: () =>
      process.env.CLAUDE_CONFIG_DIR
        ? join(process.env.CLAUDE_CONFIG_DIR, '.claude.json')
        : join(homedir(), '.claude.json'),
    serversKey: 'mcpServers',
    extraFields: { type: 'stdio' }
  })
]

function findClient(id: string): McpClient {
  const client = clients.find((candidate) => candidate.id === id)
  if (!client) throw new AppError('VALIDATION_FAILED', `Unknown MCP client ${id}`)
  return client
}

function isSameLaunch(a: McpClientConfig, b: McpClientConfig): boolean {
  return (
    a.command === b.command &&
    JSON.stringify(a.args) === JSON.stringify(b.args) &&
    JSON.stringify(a.env ?? {}) === JSON.stringify(b.env)
  )
}

function stateOf(client: McpClient, launch: McpClientConfig): McpClientState {
  if (!client.isInstalled()) return 'notInstalled'
  try {
    const entry = client.readEntry()
    if (!entry) return 'disconnected'
    return isSameLaunch(entry, launch) ? 'connected' : 'outdated'
  } catch (error) {
    if (isAppError(error, 'MCP_CLIENT_CONFIG_INVALID')) return 'invalid'
    throw error
  }
}

export function listMcpClients(): McpClientStatus[] {
  const launch = bridgeLaunchConfig()
  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    downloadUrl: client.downloadUrl,
    state: stateOf(client, launch),
    configPath: client.configPath(),
    manualEntry: client.formatEntry(launch)
  }))
}

export function initMcpClients(): void {
  handle('mcp:clients', z.tuple([]), () => listMcpClients())
  handle('mcp:connect', z.tuple([z.string()]), (_, id) => {
    findClient(id).writeEntry(bridgeLaunchConfig())
    return listMcpClients()
  })
  handle('mcp:disconnect', z.tuple([z.string()]), (_, id) => {
    findClient(id).removeEntry()
    return listMcpClients()
  })
}
