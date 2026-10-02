import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import type { Activity, ActivityInput, ActivityTag, ActivityWithTags } from '../shared/activities'
import { AppError } from '../shared/errors'
import { getActiveDatabase } from './db/database'
import { isUniqueViolation } from './db/errors'
import { activities, activityTags, tags, timeEntries } from './db/schema'
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

export function tagsByActivity(activityIds: readonly number[]): Map<number, ActivityTag[]> {
  const result = new Map<number, ActivityTag[]>()
  if (activityIds.length === 0) return result

  const rows = getActiveDatabase()
    .select({
      activityId: activityTags.activityId,
      id: tags.id,
      name: tags.name,
      color: tags.color
    })
    .from(activityTags)
    .innerJoin(tags, eq(activityTags.tagId, tags.id))
    .where(inArray(activityTags.activityId, [...activityIds]))
    .orderBy(sql`lower(${tags.name})`)
    .all()

  for (const { activityId, ...tag } of rows) {
    result.set(activityId, [...(result.get(activityId) ?? []), tag])
  }
  return result
}

export function listActivities({
  projectId,
  includeArchived = false
}: ListOptions = {}): ActivityWithTags[] {
  const rows = getActiveDatabase()
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

  const tagMap = tagsByActivity(rows.map((activity) => activity.id))
  return rows.map((activity) => ({
    ...activity,
    tagIds: (tagMap.get(activity.id) ?? []).map((tag) => tag.id)
  }))
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

export function setActivityTags(id: number, tagIds: readonly number[]): void {
  findActivity(id)
  const uniqueIds = [...new Set(tagIds)]
  if (!uniqueIds.every(Number.isInteger))
    throw new AppError('VALIDATION_FAILED', `Invalid tag ids: ${tagIds}`)

  const db = getActiveDatabase()
  db.transaction((tx) => {
    if (uniqueIds.length > 0) {
      const found = tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, uniqueIds)).all()
      if (found.length !== uniqueIds.length) throw new AppError('TAG_NOT_FOUND', String(tagIds))
    }
    tx.delete(activityTags).where(eq(activityTags.activityId, id)).run()
    if (uniqueIds.length > 0)
      tx.insert(activityTags)
        .values(uniqueIds.map((tagId) => ({ activityId: id, tagId })))
        .run()
  })
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
  handle('activities:setTags', (_, id: number, tagIds: readonly number[]) =>
    setActivityTags(id, tagIds)
  )
  handle('activities:delete', (_, id: number) => deleteActivity(id))
}
