import { homedir } from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'
import { z } from 'zod'
import { AppError, isAppError } from '../../../shared/errors'
import type { AssistantState, AssistantStatus, McpLaunchConfig } from '../../../shared/mcp'
import { handle } from '../../ipc'
import { bridgeLaunchConfig } from '../launch'
import type { Assistant } from './assistant'
import { jsonConfigAssistant } from './jsonConfigAssistant'

const claudeDesktopDir = (): string => join(app.getPath('appData'), 'Claude')

const claudeCodeDir = (): string => process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')

const assistants: readonly Assistant[] = [
  jsonConfigAssistant({
    id: 'claudeDesktop',
    name: 'Claude Desktop',
    downloadUrl: 'https://claude.ai/download',
    installDir: claudeDesktopDir,
    configPath: () => join(claudeDesktopDir(), 'claude_desktop_config.json'),
    serversKey: 'mcpServers'
  }),
  jsonConfigAssistant({
    id: 'claudeCode',
    name: 'Claude Code',
    downloadUrl: 'https://claude.ai/download',
    installDir: claudeCodeDir,
    configPath: () =>
      process.env.CLAUDE_CONFIG_DIR
        ? join(process.env.CLAUDE_CONFIG_DIR, '.claude.json')
        : join(homedir(), '.claude.json'),
    serversKey: 'mcpServers',
    extraFields: { type: 'stdio' }
  })
]

function findAssistant(id: string): Assistant {
  const assistant = assistants.find((candidate) => candidate.id === id)
  if (!assistant) throw new AppError('VALIDATION_FAILED', `Unknown assistant ${id}`)
  return assistant
}

function isSameLaunch(a: McpLaunchConfig, b: McpLaunchConfig): boolean {
  return (
    a.command === b.command &&
    JSON.stringify(a.args) === JSON.stringify(b.args) &&
    JSON.stringify(a.env ?? {}) === JSON.stringify(b.env)
  )
}

function stateOf(assistant: Assistant, launch: McpLaunchConfig): AssistantState {
  if (!assistant.isInstalled()) return 'notInstalled'
  try {
    const entry = assistant.readEntry()
    if (!entry) return 'disconnected'
    return isSameLaunch(entry, launch) ? 'connected' : 'outdated'
  } catch (error) {
    if (isAppError(error, 'ASSISTANT_CONFIG_INVALID')) return 'invalid'
    throw error
  }
}

export function listAssistants(): AssistantStatus[] {
  const launch = bridgeLaunchConfig()
  return assistants.map((assistant) => ({
    id: assistant.id,
    name: assistant.name,
    downloadUrl: assistant.downloadUrl,
    state: stateOf(assistant, launch),
    configPath: assistant.configPath(),
    manualEntry: assistant.formatEntry(launch)
  }))
}

export function initAssistants(): void {
  handle('mcp:assistants', z.tuple([]), () => listAssistants())
  handle('mcp:connect', z.tuple([z.string()]), (_, id) => {
    findAssistant(id).writeEntry(bridgeLaunchConfig())
    return listAssistants()
  })
  handle('mcp:disconnect', z.tuple([z.string()]), (_, id) => {
    findAssistant(id).removeEntry()
    return listAssistants()
  })
}
