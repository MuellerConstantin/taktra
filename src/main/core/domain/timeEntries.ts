import { fromDate, parseDate, toCalendarDateTime } from '@internationalized/date'
import { and, asc, eq, gte, lte, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { AppError, invalidInput } from '@/shared/model/errors'
import { timeEntryFilter } from '@/shared/validation'
import type { TimeEntry, TimeEntryData, TimeEntryDetails } from '@/shared/model/timeEntries'
import { getActiveDatabase } from '@/main/core/db/database'
import { activities, clients, projects, timeEntries } from '@/main/core/db/schema'
import { emit } from '@/main/core/events'
import {
  activityDetailsColumns,
  deleteActivityIfUnused,
  findActivity,
  tagsByActivity
} from './activities'
import { effectiveClientJoin } from './clients'

export const timeEntrySelection = {
  id: timeEntries.id,
  activityId: timeEntries.activityId,
  date: timeEntries.date,
  startedAt: timeEntries.startedAt,
  endedAt: timeEntries.endedAt,
  timezone: timeEntries.timezone,
  durationSec: timeEntries.durationSec,
  note: timeEntries.note
} satisfies Record<keyof TimeEntry, unknown>

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
  if (durationSec <= 0) throw invalidInput(['endedAt'], 'End must be after start')

  return {
    ...common,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    timezone: input.timezone,
    durationSec
  }
}

function findTimeEntry(id: number): TimeEntry {
  const entry = getActiveDatabase()
    .select(timeEntrySelection)
    .from(timeEntries)
    .where(eq(timeEntries.id, id))
    .get()
  if (!entry) throw new AppError('TIME_ENTRY_NOT_FOUND', String(id))
  return entry
}

export function selectTimeEntryDetails(where: SQL | undefined): TimeEntryDetails[] {
  const rows = getActiveDatabase()
    .select({ entry: timeEntrySelection, ...activityDetailsColumns })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .leftJoin(clients, effectiveClientJoin)
    .where(where)
    .orderBy(asc(timeEntries.date), asc(timeEntries.startedAt), asc(timeEntries.createdAt))
    .all()

  const tagMap = tagsByActivity([...new Set(rows.map((row) => row.activity.id))])
  return rows.map((row) => ({ ...row, tags: tagMap.get(row.activity.id) ?? [] }))
}

export function listTimeEntries({
  from,
  to,
  activityId
}: z.output<typeof timeEntryFilter>): TimeEntryDetails[] {
  return selectTimeEntryDetails(
    and(
      from === undefined ? undefined : gte(timeEntries.date, from),
      to === undefined ? undefined : lte(timeEntries.date, to),
      activityId === undefined ? undefined : eq(timeEntries.activityId, activityId)
    )
  )
}

export function createTimeEntry(input: TimeEntryData): TimeEntry {
  return getActiveDatabase()
    .insert(timeEntries)
    .values(toValues(input))
    .returning(timeEntrySelection)
    .get()
}

function isRunningEntry(entry: TimeEntry): boolean {
  return entry.startedAt !== null && entry.endedAt === null
}

/** The running timer is changed only through the timer, so it cannot be booked by accident. */
export function updateTimeEntry(id: number, input: TimeEntryData): TimeEntry {
  const previous = findTimeEntry(id)
  if (isRunningEntry(previous)) throw new AppError('TIME_ENTRY_RUNNING', String(id))
  const values = toValues(input)
  const db = getActiveDatabase()

  return db.transaction(() => {
    const entry = db
      .update(timeEntries)
      .set(values)
      .where(eq(timeEntries.id, id))
      .returning(timeEntrySelection)
      .get()
    if (previous.activityId !== entry.activityId) deleteActivityIfUnused(previous.activityId)
    return entry
  })
}

/**
 * Moves an entry to another day. Its clock times stay the same in the timezone it was recorded
 * in, also across a change to or from daylight saving time.
 */
export function moveTimeEntryToDay(id: number, date: string): TimeEntry {
  const entry = findTimeEntry(id)
  if (isRunningEntry(entry)) throw new AppError('TIME_ENTRY_RUNNING', String(id))

  const days = parseDate(date).compare(parseDate(entry.date))
  const timezone = entry.timezone ?? 'UTC'
  const shift = (time: Date): Date =>
    toCalendarDateTime(fromDate(time, timezone)).add({ days }).toDate(timezone)
  const times =
    entry.startedAt && entry.endedAt
      ? {
          startedAt: shift(entry.startedAt),
          endedAt: shift(entry.endedAt)
        }
      : {}
  const durationSec =
    times.startedAt && times.endedAt
      ? Math.round((times.endedAt.getTime() - times.startedAt.getTime()) / 1000)
      : entry.durationSec

  return getActiveDatabase()
    .update(timeEntries)
    .set({ date, ...times, durationSec })
    .where(eq(timeEntries.id, id))
    .returning(timeEntrySelection)
    .get()
}

export function setTimeEntryNote(id: number, note: string | null): void {
  const entry = findTimeEntry(id)
  getActiveDatabase().update(timeEntries).set({ note }).where(eq(timeEntries.id, id)).run()
  if (isRunningEntry(entry)) emit('signal:timer')
}

export function deleteTimeEntry(id: number): void {
  const entry = findTimeEntry(id)
  const db = getActiveDatabase()

  db.transaction(() => {
    db.delete(timeEntries).where(eq(timeEntries.id, id)).run()
    deleteActivityIfUnused(entry.activityId)
  })
  if (isRunningEntry(entry)) emit('signal:timer')
}
