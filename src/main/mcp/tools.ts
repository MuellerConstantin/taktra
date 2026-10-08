import { readFileSync } from 'node:fs'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Icon,
  type Tool
} from '@modelcontextprotocol/sdk/types.js'
import { app } from 'electron'
import { z } from 'zod'
import { isAppError } from '../../shared/errors'
import type { TimeEntryDetails } from '../../shared/timeEntries'
import { name } from '../../shared/validation'
import { findBookableActivities } from '../domain/activities'
import { getRunningTimer, startTimer } from '../domain/timer'
import iconPng from '../../../resources/icon.png?asset'
import iconSvg from '../../../resources/icon.svg?asset'

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

function embeddedIcon(path: string, mimeType: string, sizes: string[]): Icon {
  return {
    src: `data:${mimeType};base64,${readFileSync(path).toString('base64')}`,
    mimeType,
    sizes
  }
}

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'taktra',
      title: 'Taktra',
      version: app.getVersion(),
      icons: [
        embeddedIcon(iconSvg, 'image/svg+xml', ['any']),
        embeddedIcon(iconPng, 'image/png', ['1024x1024'])
      ]
    },
    { capabilities: { tools: {} } }
  )
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }))
  server.setRequestHandler(CallToolRequestSchema, (request) =>
    callTool(request.params.name, request.params.arguments)
  )
  return server
}
