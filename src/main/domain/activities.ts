import { and, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import type { Activity, ActivityTag, ActivityWithTags } from '../../shared/activities'
import type { ActivityDetails } from '../../shared/timeEntries'
import { AppError } from '../../shared/errors'
import { activityInput, activityListOptions, id, name } from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import { activities, activityTags, clients, projects, tags, timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { clientRef, effectiveClientJoin, findClient } from './clients'
import { sortByName, toNameKey } from './names'
import { findProject } from './projects'
import { notifyTimerChanged } from './timerEvents'

export function findActivity(id: number): Activity {
  const activity = getActiveDatabase().select().from(activities).where(eq(activities.id, id)).get()
  if (!activity) throw new AppError('ACTIVITY_NOT_FOUND', String(id))
  return activity
}

export const activityDetailsColumns = {
  activity: { id: activities.id, name: activities.name, archivedAt: activities.archivedAt },
  project: {
    id: projects.id,
    name: projects.name,
    color: projects.color,
    archivedAt: projects.archivedAt
  },
  client: clientRef
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
    .all()

  for (const { activityId, ...tag } of sortByName(rows)) {
    result.set(activityId, [...(result.get(activityId) ?? []), tag])
  }
  return result
}

export function listActivities({
  projectId,
  includeArchived = false
}: z.output<typeof activityListOptions> = {}): ActivityWithTags[] {
  const rows = sortByName(
    getActiveDatabase()
      .select()
      .from(activities)
      .where(
        and(
          projectId === undefined ? undefined : eq(activities.projectId, projectId),
          includeArchived ? undefined : isNull(activities.archivedAt)
        )
      )
      .all()
  )

  const tagMap = tagsByActivity(rows.map((activity) => activity.id))
  return rows.map((activity) => ({
    ...activity,
    tagIds: (tagMap.get(activity.id) ?? []).map((tag) => tag.id)
  }))
}

export function getActivityDetails(id: number): ActivityDetails {
  const row = getActiveDatabase()
    .select(activityDetailsColumns)
    .from(activities)
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .leftJoin(clients, effectiveClientJoin)
    .where(eq(activities.id, id))
    .get()
  if (!row) throw new AppError('ACTIVITY_NOT_FOUND', String(id))
  return { ...row, tags: tagsByActivity([id]).get(id) ?? [] }
}

/** Activities that can be booked on, matched by name regardless of case. */
export function findBookableActivities(
  activityName: string,
  projectName?: string
): ActivityDetails[] {
  const rows = getActiveDatabase()
    .select(activityDetailsColumns)
    .from(activities)
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .leftJoin(clients, effectiveClientJoin)
    .where(
      and(
        eq(activities.nameKey, toNameKey(activityName)),
        projectName === undefined ? undefined : eq(projects.nameKey, toNameKey(projectName)),
        isNull(activities.archivedAt),
        isNull(projects.archivedAt)
      )
    )
    .all()

  const tagMap = tagsByActivity(rows.map((row) => row.activity.id))
  return rows.map((row) => ({ ...row, tags: tagMap.get(row.activity.id) ?? [] }))
}

function assertClientAssignable(projectId: number, clientId: number | null): void {
  if (clientId === null) return
  if (findProject(projectId).clientId !== null)
    throw new AppError('CLIENT_SET_BY_PROJECT', String(projectId))
  findClient(clientId)
}

export function createActivity(input: z.output<typeof activityInput>): Activity {
  findProject(input.projectId)
  assertClientAssignable(input.projectId, input.clientId ?? null)

  try {
    return getActiveDatabase()
      .insert(activities)
      .values({ ...input, nameKey: toNameKey(input.name) })
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
    const activity = getActiveDatabase()
      .update(activities)
      .set({ name, nameKey: toNameKey(name) })
      .where(eq(activities.id, id))
      .returning()
      .get()
    notifyTimerChanged()
    return activity
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('ACTIVITY_NAME_TAKEN', String(error))
    throw error
  }
}

/**
 * Moves the activity with its time entries to another project, renamed in the same step. A
 * client of the source project stays with the activity unless the target project sets its own.
 */
export function moveActivity(id: number, projectId: number, name: string): Activity {
  const previous = findActivity(id)
  const source = findProject(previous.projectId)
  const target = findProject(projectId)
  const clientId = target.clientId === null ? (source.clientId ?? previous.clientId) : null

  try {
    const activity = getActiveDatabase()
      .update(activities)
      .set({ projectId, name, nameKey: toNameKey(name), clientId })
      .where(eq(activities.id, id))
      .returning()
      .get()
    notifyTimerChanged()
    return activity
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

export function setActivityClient(id: number, clientId: number | null): Activity {
  const { projectId } = findActivity(id)
  assertClientAssignable(projectId, clientId)

  const activity = getActiveDatabase()
    .update(activities)
    .set({ clientId })
    .where(eq(activities.id, id))
    .returning()
    .get()
  notifyTimerChanged()
  return activity
}

export function setActivityTags(id: number, tagIds: readonly number[]): void {
  findActivity(id)
  const uniqueIds = [...new Set(tagIds)]

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
  notifyTimerChanged()
}

function hasTimeEntries(id: number): boolean {
  return !!getActiveDatabase()
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .where(eq(timeEntries.activityId, id))
    .limit(1)
    .get()
}

export function deleteActivityIfUnused(id: number): void {
  if (!hasTimeEntries(id)) getActiveDatabase().delete(activities).where(eq(activities.id, id)).run()
}

export function deleteActivity(id: number): void {
  findActivity(id)
  if (hasTimeEntries(id)) throw new AppError('ACTIVITY_HAS_TIME_ENTRIES', String(id))
  getActiveDatabase().delete(activities).where(eq(activities.id, id)).run()
}

export function initActivities(): void {
  handle('activities:list', z.tuple([activityListOptions]), (_, options) => listActivities(options))
  handle('activities:get', z.tuple([id]), (_, activityId) => getActivityDetails(activityId))
  handle('activities:create', z.tuple([activityInput]), (_, input) => createActivity(input))
  handle('activities:rename', z.tuple([id, name]), (_, activityId, newName) =>
    renameActivity(activityId, newName)
  )
  handle('activities:move', z.tuple([id, id, name]), (_, activityId, projectId, newName) =>
    moveActivity(activityId, projectId, newName)
  )
  handle('activities:setArchived', z.tuple([id, z.boolean()]), (_, activityId, archived) =>
    setActivityArchived(activityId, archived)
  )
  handle('activities:setClient', z.tuple([id, id.nullable()]), (_, activityId, clientId) =>
    setActivityClient(activityId, clientId)
  )
  handle('activities:setTags', z.tuple([id, z.array(id)]), (_, activityId, tagIds) =>
    setActivityTags(activityId, tagIds)
  )
  handle('activities:delete', z.tuple([id]), (_, activityId) => deleteActivity(activityId))
}
