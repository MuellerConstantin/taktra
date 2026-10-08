import { rmSync } from 'node:fs'
import { createServer, type Server as PipeServer, type Socket } from 'node:net'
import { join } from 'node:path'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool
} from '@modelcontextprotocol/sdk/types.js'
import { app } from 'electron'
import { z } from 'zod'
import { isAppError } from '../../shared/errors'
import type { McpClientConfig } from '../../shared/mcp'
import type { TimeEntryDetails } from '../../shared/timeEntries'
import { name } from '../../shared/validation'
import { findBookableActivities } from '../domain/activities'
import { getRunningTimer, startTimer } from '../domain/timer'
import { handle } from '../ipc'
import { mcpPipePath } from '../mcpPipe'
import { getSettings, onSettingsChanged } from '../settings'

const startTimerInput = z.object({
  activity: name.describe('Name of the activity, as shown in Taktra'),
  project: name.optional().describe('Name of its project, needed when the name is not unique')
})

const tools: Tool[] = [
  {
    name: 'get_running_timer',
    description: 'Returns the timer running in Taktra, or that no timer runs.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true }
  },
  {
    name: 'start_timer',
    description:
      'Starts the Taktra timer for an existing activity. A running timer is stopped and booked first.',
    inputSchema: z.toJSONSchema(startTimerInput, { io: 'input' }) as Tool['inputSchema']
  }
]

class ToolError extends Error {}

function describeTimer(timer: TimeEntryDetails | null): object {
  if (!timer) return { running: false }
  return {
    running: true,
    activity: timer.activity.name,
    project: timer.project.name,
    client: timer.client?.name ?? null,
    tags: timer.tags.map((tag) => tag.name),
    startedAt: timer.entry.startedAt?.toISOString() ?? null
  }
}

function startTimerByName(args: unknown): TimeEntryDetails {
  const parsed = startTimerInput.safeParse(args)
  if (!parsed.success) throw new ToolError(z.prettifyError(parsed.error))

  const { activity, project } = parsed.data
  const matches = findBookableActivities(activity, project)
  if (matches.length === 0)
    throw new ToolError(`No activity "${activity}"${project ? ` in project "${project}"` : ''}.`)
  if (matches.length > 1) {
    const projects = matches.map((match) => `"${match.project.name}"`).join(', ')
    throw new ToolError(`Several projects have an activity "${activity}": ${projects}.`)
  }
  return startTimer(matches[0].activity.id)
}

function runTool(toolName: string, args: unknown): TimeEntryDetails | null {
  if (toolName === 'get_running_timer') return getRunningTimer()
  if (toolName === 'start_timer') return startTimerByName(args)
  throw new ToolError(`Unknown tool "${toolName}".`)
}

function errorMessage(toolName: string, error: unknown): string {
  if (error instanceof ToolError) return error.message
  if (isAppError(error, 'NO_ACTIVE_PROFILE')) return 'No profile is open in Taktra.'
  console.error(`MCP tool "${toolName}" failed`, error)
  return 'Taktra could not complete the request.'
}

function callTool(toolName: string, args: unknown): CallToolResult {
  try {
    const text = JSON.stringify(describeTimer(runTool(toolName, args)))
    return { content: [{ type: 'text', text }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: errorMessage(toolName, error) }] }
  }
}

function createMcpServer(): Server {
  const server = new Server(
    { name: 'taktra', version: app.getVersion() },
    { capabilities: { tools: {} } }
  )
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }))
  server.setRequestHandler(CallToolRequestSchema, (request) =>
    callTool(request.params.name, request.params.arguments)
  )
  return server
}

let pipeServer: PipeServer | null = null
const connections = new Set<Socket>()

function startServing(): void {
  if (pipeServer) return
  const path = mcpPipePath()
  // A socket file left behind by a crash blocks listening; the single instance lock means no
  // other Taktra uses it. Named pipes on Windows vanish with their process.
  if (process.platform !== 'win32') rmSync(path, { force: true })

  pipeServer = createServer((socket) => {
    connections.add(socket)
    socket.on('close', () => connections.delete(socket))
    createMcpServer()
      .connect(new StdioServerTransport(socket, socket))
      .catch((error) => console.error('MCP connection failed', error))
  })
  pipeServer.on('error', (error) => console.error('MCP pipe failed', error))
  pipeServer.listen(path)
}

function stopServing(): void {
  pipeServer?.close()
  pipeServer = null
  for (const socket of connections) socket.destroy()
}

function applyMcpAccess(): void {
  if (getSettings().mcpAccess) startServing()
  else stopServing()
}

function getMcpClientConfig(): McpClientConfig {
  return {
    command: process.execPath,
    args: [join(app.getAppPath(), 'out', 'main', 'mcp.js')],
    env: { ELECTRON_RUN_AS_NODE: '1' }
  }
}

export function initMcp(): void {
  applyMcpAccess()
  onSettingsChanged(applyMcpAccess)
  handle('mcp:config', z.tuple([]), () => getMcpClientConfig())
}
