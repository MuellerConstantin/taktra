import { and, desc, eq, isNotNull, isNull, max, sql } from 'drizzle-orm'
import { BrowserWindow } from 'electron'
import { z } from 'zod'
import { AppError, isAppError } from '../shared/errors'
import { id } from '../shared/validation'
import type { ActivityDetails, TimeEntryDetails } from '../shared/timeEntries'
import { findActivity, tagsByActivity } from './activities'
import { getActiveDatabase } from './db/database'
import { activities, projects, timeEntries } from './db/schema'
import { handle } from './ipc'
import { findProject } from './projects'
import { deleteTimeEntry, selectTimeEntryDetails } from './timeEntries'

const isRunning = and(isNotNull(timeEntries.startedAt), isNull(timeEntries.endedAt))

function toLocalDate(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const listeners = new Set<() => void>()

export function onTimerChanged(listener: () => void): void {
  listeners.add(listener)
}

function notifyTimerChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('timer:changed')
  for (const listener of listeners) listener()
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
      }
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
  handle('timer:get', z.tuple([]), () => getRunningTimer())
  handle('timer:start', z.tuple([id]), (_, activityId) => startTimer(activityId))
  handle('timer:stop', z.tuple([]), () => stopTimer())
  handle('timer:discard', z.tuple([]), () => discardTimer())
  handle('timer:recent', z.tuple([id.max(50)]), (_, limit) => listRecentActivities(limit))
}
