import { and, desc, eq, isNotNull, isNull, max, sql } from 'drizzle-orm'
import { z } from 'zod'
import { AppError, isAppError } from '../../shared/errors'
import { id } from '../../shared/validation'
import type { ActivityDetails, TimeEntryDetails } from '../../shared/timeEntries'
import { getActiveDatabase } from '../db/database'
import { activities, clients, projects, timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { findActivity, tagsByActivity } from './activities'
import { clientRef, effectiveClientJoin } from './clients'
import { findProject } from './projects'
import { deleteTimeEntry, selectTimeEntryDetails } from './timeEntries'
import { notifyTimerChanged } from './timerEvents'

const isRunning = and(isNotNull(timeEntries.startedAt), isNull(timeEntries.endedAt))

function toLocalDate(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const MINUTE_MS = 60_000

function roundToMinute(date: Date): Date {
  return new Date(Math.round(date.getTime() / MINUTE_MS) * MINUTE_MS)
}

/**
 * Rounds the clock times rather than the duration, so the end of a stopped timer and the start
 * of the one started in the same moment fall on the same minute instead of overlapping.
 */
function bookedTimes(
  startedAt: Date,
  stoppedAt: Date
): { readonly startedAt: Date; readonly endedAt: Date; readonly durationSec: number } {
  const start = roundToMinute(startedAt)
  const end = new Date(Math.max(roundToMinute(stoppedAt).getTime(), start.getTime() + MINUTE_MS))
  return {
    startedAt: start,
    endedAt: end,
    durationSec: (end.getTime() - start.getTime()) / 1000
  }
}

function stopRunning(now: Date): void {
  const db = getActiveDatabase()
  const entry = db.select().from(timeEntries).where(isRunning).get()
  if (!entry?.startedAt) return

  db.update(timeEntries)
    .set(bookedTimes(entry.startedAt, now))
    .where(eq(timeEntries.id, entry.id))
    .run()
}

export function getRunningTimer(): TimeEntryDetails | null {
  return selectTimeEntryDetails(isRunning)[0] ?? null
}

export function hasRunningTimer(): boolean {
  try {
    return getActiveDatabase().select().from(timeEntries).where(isRunning).get() !== undefined
  } catch (error) {
    if (isAppError(error, 'NO_ACTIVE_PROFILE')) return false
    throw error
  }
}

export function startTimer(activityId: number): TimeEntryDetails {
  const activity = findActivity(activityId)
  if (activity.archivedAt || findProject(activity.projectId).archivedAt)
    throw new AppError('VALIDATION_FAILED', 'Activity or project is archived')

  const db = getActiveDatabase()
  const now = new Date()
  const timer = db.transaction(() => {
    stopRunning(now)
    db.insert(timeEntries)
      .values({
        activityId,
        date: toLocalDate(now),
        startedAt: now,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
      .run()
    return getRunningTimer()!
  })
  notifyTimerChanged()
  return timer
}

export function stopTimer(): void {
  const db = getActiveDatabase()
  db.transaction(() => stopRunning(new Date()))
  notifyTimerChanged()
}

export function discardTimer(): void {
  const entry = getActiveDatabase().select().from(timeEntries).where(isRunning).get()
  if (!entry) return
  deleteTimeEntry(entry.id)
  notifyTimerChanged()
}

export function listRecentActivities(limit: number): ActivityDetails[] {
  const rows = getActiveDatabase()
    .select({
      activity: { id: activities.id, name: activities.name, archivedAt: activities.archivedAt },
      project: {
        id: projects.id,
        name: projects.name,
        color: projects.color,
        archivedAt: projects.archivedAt
      },
      client: clientRef
    })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .leftJoin(clients, effectiveClientJoin)
    .where(and(isNull(activities.archivedAt), isNull(projects.archivedAt)))
    .groupBy(activities.id)
    .orderBy(
      desc(max(timeEntries.date)),
      desc(sql`max(coalesce(${timeEntries.startedAt}, ${timeEntries.createdAt}))`)
    )
    .limit(limit)
    .all()

  const tagMap = tagsByActivity(rows.map((row) => row.activity.id))
  return rows.map((row) => ({ ...row, tags: tagMap.get(row.activity.id) ?? [] }))
}

export function initTimer(): void {
  handle('timer:get', z.tuple([]), () => getRunningTimer())
  handle('timer:start', z.tuple([id]), (_, activityId) => startTimer(activityId))
  handle('timer:stop', z.tuple([]), () => stopTimer())
  handle('timer:discard', z.tuple([]), () => discardTimer())
  handle('timer:recent', z.tuple([id.max(50)]), (_, limit) => listRecentActivities(limit))
}
