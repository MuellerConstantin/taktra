import { and, desc, eq, isNotNull, isNull, max, sql } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import type { ActivityDetails, TimeEntryDetails } from '../shared/timeEntries'
import { findActivity, tagsByActivity } from './activities'
import { getActiveDatabase } from './db/database'
import { activities, projects, timeEntries } from './db/schema'
import { handle } from './ipc'
import { deleteTimeEntry, selectTimeEntryDetails } from './timeEntries'

const isRunning = and(isNotNull(timeEntries.startedAt), isNull(timeEntries.endedAt))

function toLocalDate(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function stopRunning(now: Date): void {
  const db = getActiveDatabase()
  const entry = db.select().from(timeEntries).where(isRunning).get()
  if (!entry?.startedAt) return

  const durationSec =
    Math.max(1, Math.round((now.getTime() - entry.startedAt.getTime()) / 60_000)) * 60
  db.update(timeEntries)
    .set({ endedAt: new Date(entry.startedAt.getTime() + durationSec * 1000), durationSec })
    .where(eq(timeEntries.id, entry.id))
    .run()
}

export function getRunningTimer(): TimeEntryDetails | null {
  return selectTimeEntryDetails(isRunning)[0] ?? null
}

export function startTimer(activityId: number): TimeEntryDetails {
  const activity = findActivity(activityId)
  if (activity.archivedAt) throw new AppError('VALIDATION_FAILED', 'Activity is archived')

  const db = getActiveDatabase()
  const now = new Date()
  return db.transaction(() => {
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
}

export function stopTimer(): void {
  const db = getActiveDatabase()
  db.transaction(() => stopRunning(new Date()))
}

export function discardTimer(): void {
  const entry = getActiveDatabase().select().from(timeEntries).where(isRunning).get()
  if (entry) deleteTimeEntry(entry.id)
}

export function listRecentActivities(limit: number): ActivityDetails[] {
  if (!Number.isInteger(limit) || limit <= 0)
    throw new AppError('VALIDATION_FAILED', `Invalid limit: ${limit}`)

  const rows = getActiveDatabase()
    .select({
      activity: { id: activities.id, name: activities.name },
      project: { id: projects.id, name: projects.name, color: projects.color }
    })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
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
  handle('timer:get', () => getRunningTimer())
  handle('timer:start', (_, activityId: number) => startTimer(activityId))
  handle('timer:stop', () => stopTimer())
  handle('timer:discard', () => discardTimer())
  handle('timer:recent', (_, limit: number) => listRecentActivities(limit))
}
