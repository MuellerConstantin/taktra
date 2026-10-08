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
import type { ActivityDetails, TimeEntryDetails } from '../../shared/timeEntries'
import { MAX_NAME_LENGTH, id, name } from '../../shared/validation'
import { listBookableActivities } from '../domain/activities'
import { listClients } from '../domain/clients'
import { toNameKey } from '../domain/names'
import { listProjects } from '../domain/projects'
import { getRunningTimer, startTimer, stopTimer } from '../domain/timer'
import { getActiveProfileName } from '../profiles'
import iconPng from '../../../resources/icon.png?asset'
import iconSvg from '../../../resources/icon.svg?asset'

const LIST_LIMIT = 200
const SEARCH_LIMIT = 50

const query = z.string().trim().min(1).max(MAX_NAME_LENGTH).describe('Part of a name to look for')

const noInput = z.object({})

const profile = name.describe(
  'Name of the profile the ids come from, as returned with them; ids are only valid in their profile'
)

const projectFilter = {
  projectId: id.optional().describe('Only activities of this project'),
  profile: profile.optional().describe('Required with projectId: the profile the id comes from')
}

const requiresProfile = (input: { projectId?: number; profile?: string }): boolean =>
  input.projectId === undefined || input.profile !== undefined

const listActivitiesInput = z
  .object(projectFilter)
  .refine(requiresProfile, { message: 'profile is required with projectId', path: ['profile'] })

const searchProjectsInput = z.object({ query })

const searchActivitiesInput = z
  .object({
    query: query.describe('Part of the name of the activity, its project or its client'),
    ...projectFilter
  })
  .refine(requiresProfile, { message: 'profile is required with projectId', path: ['profile'] })

const startTimerInput = z.object({
  activityId: id.describe('Id of the activity, from list_activities or search_activities'),
  profile
})

class ToolError extends Error {}

function parse<T extends z.ZodType>(schema: T, args: unknown): z.output<T> {
  const parsed = schema.safeParse(args ?? {})
  if (!parsed.success) throw new ToolError(z.prettifyError(parsed.error))
  return parsed.data
}

function matches(text: string | null | undefined, search: string): boolean {
  return text !== null && text !== undefined && toNameKey(text).includes(toNameKey(search))
}

function limited<T>(items: readonly T[], limit: number): { items: T[]; truncated: boolean } {
  return { items: items.slice(0, limit), truncated: items.length > limit }
}

function describeProjects(): { id: number; name: string; client: string | null }[] {
  const clientNames = new Map(
    listClients({ includeArchived: true }).map((client) => [client.id, client.name])
  )
  return listProjects().map((project) => ({
    id: project.id,
    name: project.name,
    client: project.clientId === null ? null : (clientNames.get(project.clientId) ?? null)
  }))
}

function describeActivity(details: ActivityDetails): object {
  return {
    id: details.activity.id,
    name: details.activity.name,
    projectId: details.project.id,
    project: details.project.name,
    client: details.client?.name ?? null,
    tags: details.tags.map((tag) => tag.name)
  }
}

function describeEntry(details: TimeEntryDetails): object {
  return {
    activityId: details.activity.id,
    activity: details.activity.name,
    project: details.project.name,
    client: details.client?.name ?? null,
    tags: details.tags.map((tag) => tag.name),
    startedAt: details.entry.startedAt?.toISOString() ?? null
  }
}

function describeTimer(timer: TimeEntryDetails | null): object {
  return timer ? { running: true, ...describeEntry(timer) } : { running: false }
}

function describeBooking(booked: TimeEntryDetails | null): object {
  if (!booked) return { stopped: false }
  return {
    stopped: true,
    ...describeEntry(booked),
    endedAt: booked.entry.endedAt?.toISOString() ?? null,
    durationMinutes: Math.round((booked.entry.durationSec ?? 0) / 60)
  }
}

/** Refuses ids from another profile, which would silently mean other projects or activities. */
function assertActiveProfile(expected: string | undefined): void {
  if (expected === undefined) return
  const activeProfile = getActiveProfileName()
  if (expected !== activeProfile)
    throw new ToolError(
      `The active profile is "${activeProfile}", not "${expected}". Look up the ids again.`
    )
}

function startTimerById(args: unknown): TimeEntryDetails {
  const { activityId, profile } = parse(startTimerInput, args)
  assertActiveProfile(profile)
  try {
    return startTimer(activityId)
  } catch (error) {
    if (isAppError(error, 'ACTIVITY_NOT_FOUND'))
      throw new ToolError(`No activity with id ${activityId} in profile "${profile}".`)
    if (isAppError(error, 'VALIDATION_FAILED'))
      throw new ToolError('The activity or its project is archived.')
    throw error
  }
}

interface ToolDefinition {
  readonly title: string
  readonly description: string
  readonly input: z.ZodObject
  readonly annotations?: Tool['annotations']
  readonly run: (args: unknown) => object
}

const definitions: Readonly<Record<string, ToolDefinition>> = {
  get_active_profile: {
    title: 'Show active profile',
    description:
      'Returns the profile open in Taktra. Ids of projects and activities are only valid in their profile.',
    input: noInput,
    annotations: { readOnlyHint: true },
    run: () => ({})
  },
  get_running_timer: {
    title: 'Show running timer',
    description: 'Returns the timer running in Taktra, or that no timer runs.',
    input: noInput,
    annotations: { readOnlyHint: true },
    run: () => describeTimer(getRunningTimer())
  },
  list_projects: {
    title: 'List projects',
    description: 'Lists all projects that are not archived, with their client.',
    input: noInput,
    annotations: { readOnlyHint: true },
    run: () => ({ projects: describeProjects() })
  },
  search_projects: {
    title: 'Search projects',
    description: 'Finds projects that are not archived by part of their name or their client.',
    input: searchProjectsInput,
    annotations: { readOnlyHint: true },
    run: (args) => {
      const { query } = parse(searchProjectsInput, args)
      const found = describeProjects().filter(
        (project) => matches(project.name, query) || matches(project.client, query)
      )
      const { items, truncated } = limited(found, SEARCH_LIMIT)
      return { projects: items, truncated }
    }
  },
  list_activities: {
    title: 'List activities',
    description:
      'Lists the activities time can be booked on, optionally of one project, with their project, client and tags.',
    input: listActivitiesInput,
    annotations: { readOnlyHint: true },
    run: (args) => {
      const { projectId, profile } = parse(listActivitiesInput, args)
      assertActiveProfile(profile)
      const { items, truncated } = limited(listBookableActivities(projectId), LIST_LIMIT)
      return { activities: items.map(describeActivity), truncated }
    }
  },
  search_activities: {
    title: 'Search activities',
    description:
      'Finds activities time can be booked on by part of their name, their project or their client.',
    input: searchActivitiesInput,
    annotations: { readOnlyHint: true },
    run: (args) => {
      const { query, projectId, profile } = parse(searchActivitiesInput, args)
      assertActiveProfile(profile)
      const found = listBookableActivities(projectId).filter(
        (details) =>
          matches(details.activity.name, query) ||
          matches(details.project.name, query) ||
          matches(details.client?.name, query)
      )
      const { items, truncated } = limited(found, SEARCH_LIMIT)
      return { activities: items.map(describeActivity), truncated }
    }
  },
  start_timer: {
    title: 'Start timer',
    description:
      'Starts the Taktra timer for an activity. A running timer is stopped and booked first.',
    input: startTimerInput,
    run: (args) => describeTimer(startTimerById(args))
  },
  stop_timer: {
    title: 'Stop timer',
    description: 'Stops the running Taktra timer and books its time.',
    input: noInput,
    annotations: { idempotentHint: true },
    run: () => describeBooking(stopTimer())
  }
}

const tools: Tool[] = Object.entries(definitions).map(([toolName, definition]) => ({
  name: toolName,
  title: definition.title,
  description: definition.description,
  inputSchema: z.toJSONSchema(definition.input, { io: 'input' }) as Tool['inputSchema'],
  annotations: definition.annotations
}))

function errorMessage(toolName: string, error: unknown): string {
  if (error instanceof ToolError) return error.message
  if (isAppError(error, 'NO_ACTIVE_PROFILE')) return 'No profile is open in Taktra.'
  console.error(`MCP tool "${toolName}" failed`, error)
  return 'Taktra could not complete the request.'
}

function callTool(toolName: string, args: unknown): CallToolResult {
  try {
    const definition = definitions[toolName]
    if (!definition) throw new ToolError(`Unknown tool "${toolName}".`)
    const result = definition.run(args)
    const text = JSON.stringify({ profile: getActiveProfileName(), ...result })
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
