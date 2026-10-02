import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import type {
  TimeEntry,
  TimeEntryDetails,
  TimeEntryInput,
  TimeEntryRange
} from '../shared/timeEntries'
import { findActivity, tagsByActivity } from './activities'
import { getActiveDatabase } from './db/database'
import { activities, projects, timeEntries } from './db/schema'
import { handle } from './ipc'

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/

type TimeEntryValues = Pick<
  TimeEntry,
  'activityId' | 'date' | 'startedAt' | 'endedAt' | 'timezone' | 'durationSec' | 'note'
>

function invalid(message: string): AppError {
  return new AppError('VALIDATION_FAILED', message)
}

function assertLocalDate(date: string): void {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (
    !LOCAL_DATE.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    !parsed.toISOString().startsWith(date)
  )
    throw invalid(`Invalid date: ${date}`)
}

function assertTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone })
  } catch {
    throw invalid(`Invalid timezone: ${timezone}`)
  }
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw invalid(`Invalid ${field}`)
}

function toValues(input: TimeEntryInput): TimeEntryValues {
  assertLocalDate(input.date)
  findActivity(input.activityId)

  const common = {
    activityId: input.activityId,
    date: input.date,
    note: input.note?.trim() || null
  }

  if ('durationSec' in input) {
    if (!Number.isInteger(input.durationSec) || input.durationSec <= 0)
      throw invalid(`Invalid duration: ${input.durationSec}`)
    return {
      ...common,
      startedAt: null,
      endedAt: null,
      timezone: null,
      durationSec: input.durationSec
    }
  }

  assertValidDate(input.startedAt, 'start')
  assertValidDate(input.endedAt, 'end')
  assertTimezone(input.timezone)
  const durationSec = Math.round((input.endedAt.getTime() - input.startedAt.getTime()) / 1000)
  if (durationSec <= 0) throw invalid('End must be after start')

  return {
    ...common,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    timezone: input.timezone,
    durationSec
  }
}

function findTimeEntry(id: number): TimeEntry {
  const entry = getActiveDatabase().select().from(timeEntries).where(eq(timeEntries.id, id)).get()
  if (!entry) throw new AppError('TIME_ENTRY_NOT_FOUND', String(id))
  return entry
}

export function listTimeEntries({ from, to }: TimeEntryRange): TimeEntryDetails[] {
  assertLocalDate(from)
  assertLocalDate(to)

  const rows = getActiveDatabase()
    .select({
      entry: timeEntries,
      activity: { id: activities.id, name: activities.name },
      project: { id: projects.id, name: projects.name, color: projects.color }
    })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .where(and(gte(timeEntries.date, from), lte(timeEntries.date, to)))
    .orderBy(asc(timeEntries.date), asc(timeEntries.startedAt), asc(timeEntries.createdAt))
    .all()

  const tagMap = tagsByActivity([...new Set(rows.map((row) => row.activity.id))])
  return rows.map((row) => ({ ...row, tags: tagMap.get(row.activity.id) ?? [] }))
}

export function createTimeEntry(input: TimeEntryInput): TimeEntry {
  return getActiveDatabase().insert(timeEntries).values(toValues(input)).returning().get()
}

export function updateTimeEntry(id: number, input: TimeEntryInput): TimeEntry {
  findTimeEntry(id)

  return getActiveDatabase()
    .update(timeEntries)
    .set(toValues(input))
    .where(eq(timeEntries.id, id))
    .returning()
    .get()
}

export function deleteTimeEntry(id: number): void {
  findTimeEntry(id)
  getActiveDatabase().delete(timeEntries).where(eq(timeEntries.id, id)).run()
}

export function initTimeEntries(): void {
  handle('timeEntries:list', (_, range: TimeEntryRange) => listTimeEntries(range))
  handle('timeEntries:create', (_, input: TimeEntryInput) => createTimeEntry(input))
  handle('timeEntries:update', (_, id: number, input: TimeEntryInput) => updateTimeEntry(id, input))
  handle('timeEntries:delete', (_, id: number) => deleteTimeEntry(id))
}
