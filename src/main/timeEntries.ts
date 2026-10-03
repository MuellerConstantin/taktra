import { and, asc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { AppError } from '../shared/errors'
import { id, timeEntryInput, timeEntryRange } from '../shared/validation'
import type { TimeEntry, TimeEntryData, TimeEntryDetails } from '../shared/timeEntries'
import { deleteActivityIfUnused, findActivity, tagsByActivity } from './activities'
import { getActiveDatabase } from './db/database'
import { activities, projects, timeEntries } from './db/schema'
import { handle } from './ipc'

type TimeEntryValues = Pick<
  TimeEntry,
  'activityId' | 'date' | 'startedAt' | 'endedAt' | 'timezone' | 'durationSec' | 'note'
>

function toValues(input: TimeEntryData): TimeEntryValues {
  findActivity(input.activityId)

  const common = { activityId: input.activityId, date: input.date, note: input.note ?? null }

  if ('durationSec' in input) {
    return {
      ...common,
      startedAt: null,
      endedAt: null,
      timezone: null,
      durationSec: input.durationSec
    }
  }

  const durationSec = Math.round((input.endedAt.getTime() - input.startedAt.getTime()) / 1000)
  if (durationSec <= 0) throw new AppError('VALIDATION_FAILED', 'End must be after start')

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

export function selectTimeEntryDetails(where: SQL | undefined): TimeEntryDetails[] {
  const rows = getActiveDatabase()
    .select({
      entry: timeEntries,
      activity: { id: activities.id, name: activities.name, archivedAt: activities.archivedAt },
      project: {
        id: projects.id,
        name: projects.name,
        color: projects.color,
        archivedAt: projects.archivedAt
      }
    })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .where(where)
    .orderBy(asc(timeEntries.date), asc(timeEntries.startedAt), asc(timeEntries.createdAt))
    .all()

  const tagMap = tagsByActivity([...new Set(rows.map((row) => row.activity.id))])
  return rows.map((row) => ({ ...row, tags: tagMap.get(row.activity.id) ?? [] }))
}

export function listTimeEntries({ from, to }: z.output<typeof timeEntryRange>): TimeEntryDetails[] {
  return selectTimeEntryDetails(and(gte(timeEntries.date, from), lte(timeEntries.date, to)))
}

export function createTimeEntry(input: TimeEntryData): TimeEntry {
  return getActiveDatabase().insert(timeEntries).values(toValues(input)).returning().get()
}

export function updateTimeEntry(id: number, input: TimeEntryData): TimeEntry {
  const previous = findTimeEntry(id)
  const values = toValues(input)
  const db = getActiveDatabase()

  return db.transaction(() => {
    const entry = db.update(timeEntries).set(values).where(eq(timeEntries.id, id)).returning().get()
    if (previous.activityId !== entry.activityId) deleteActivityIfUnused(previous.activityId)
    return entry
  })
}

export function deleteTimeEntry(id: number): void {
  const entry = findTimeEntry(id)
  const db = getActiveDatabase()

  db.transaction(() => {
    db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
    deleteActivityIfUnused(entry.activityId)
  })
}

export function initTimeEntries(): void {
  handle('timeEntries:list', z.tuple([timeEntryRange]), (_, range) => listTimeEntries(range))
  handle('timeEntries:create', z.tuple([timeEntryInput]), (_, input) => createTimeEntry(input))
  handle('timeEntries:update', z.tuple([id, timeEntryInput]), (_, entryId, input) =>
    updateTimeEntry(entryId, input)
  )
  handle('timeEntries:delete', z.tuple([id]), (_, entryId) => deleteTimeEntry(entryId))
}
