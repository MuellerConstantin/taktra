import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Activity, ActivityInput } from '../shared/activities'
import { AppError } from '../shared/errors'
import { getActiveDatabase } from './db/database'
import { isUniqueViolation } from './db/errors'
import { activities, timeEntries } from './db/schema'
import { handle } from './ipc'
import { findProject } from './projects'

interface ListOptions {
  readonly projectId?: number
  readonly includeArchived?: boolean
}

function normalizeName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new AppError('VALIDATION_FAILED', 'Activity name must not be empty')
  return trimmed
}

export function findActivity(id: number): Activity {
  const activity = getActiveDatabase().select().from(activities).where(eq(activities.id, id)).get()
  if (!activity) throw new AppError('ACTIVITY_NOT_FOUND', String(id))
  return activity
}

export function listActivities({
  projectId,
  includeArchived = false
}: ListOptions = {}): Activity[] {
  return getActiveDatabase()
    .select()
    .from(activities)
    .where(
      and(
        projectId === undefined ? undefined : eq(activities.projectId, projectId),
        includeArchived ? undefined : isNull(activities.archivedAt)
      )
    )
    .orderBy(sql`lower(${activities.name})`)
    .all()
}

export function createActivity(input: ActivityInput): Activity {
  findProject(input.projectId)

  try {
    return getActiveDatabase()
      .insert(activities)
      .values({ projectId: input.projectId, name: normalizeName(input.name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('ACTIVITY_NAME_TAKEN', String(error))
    throw error
  }
}

export function renameActivity(id: number, name: string): Activity {
  findActivity(id)

  try {
    return getActiveDatabase()
      .update(activities)
      .set({ name: normalizeName(name) })
      .where(eq(activities.id, id))
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('ACTIVITY_NAME_TAKEN', String(error))
    throw error
  }
}

export function setActivityArchived(id: number, archived: boolean): Activity {
  findActivity(id)

  return getActiveDatabase()
    .update(activities)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(activities.id, id))
    .returning()
    .get()
}

export function deleteActivity(id: number): void {
  findActivity(id)

  const db = getActiveDatabase()
  const hasEntries = db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(eq(timeEntries.activityId, id))
    .limit(1)
    .get()
  if (hasEntries) throw new AppError('ACTIVITY_HAS_TIME_ENTRIES', String(id))

  db.delete(activities).where(eq(activities.id, id)).run()
}

export function initActivities(): void {
  handle('activities:list', (_, options?: ListOptions) => listActivities(options))
  handle('activities:create', (_, input: ActivityInput) => createActivity(input))
  handle('activities:rename', (_, id: number, name: string) => renameActivity(id, name))
  handle('activities:setArchived', (_, id: number, archived: boolean) =>
    setActivityArchived(id, archived)
  )
  handle('activities:delete', (_, id: number) => deleteActivity(id))
}
