import { eq, isNull } from 'drizzle-orm'
import { AppError } from '../../shared/errors'
import { z } from 'zod'
import type { Project, ProjectData } from '../../shared/projects'
import { id, listOptions, projectInput } from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import { activities, projects, timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { findClient } from './clients'
import { sortByName, toNameKey } from './names'
import { notifyTimerChanged } from './timerEvents'

export function findProject(id: number): Project {
  const project = getActiveDatabase().select().from(projects).where(eq(projects.id, id)).get()
  if (!project) throw new AppError('PROJECT_NOT_FOUND', String(id))
  return project
}

export function listProjects({
  includeArchived = false
}: z.output<typeof listOptions> = {}): Project[] {
  return sortByName(
    getActiveDatabase()
      .select()
      .from(projects)
      .where(includeArchived ? undefined : isNull(projects.archivedAt))
      .all()
  )
}

export function createProject(input: ProjectData): Project {
  if (input.clientId) findClient(input.clientId)

  try {
    return getActiveDatabase()
      .insert(projects)
      .values({ ...input, nameKey: toNameKey(input.name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('PROJECT_NAME_TAKEN', String(error))
    throw error
  }
}

/**
 * A client on the project replaces the clients of its activities. Removing it hands it down
 * to the activities, so the time booked on them keeps counting towards that client.
 */
export function updateProject(id: number, patch: Partial<ProjectData>): Project {
  const previous = findProject(id)
  if (patch.clientId) findClient(patch.clientId)
  const clientChanged = patch.clientId !== undefined && patch.clientId !== previous.clientId

  try {
    const project = getActiveDatabase().transaction((tx) => {
      if (clientChanged)
        tx.update(activities)
          .set({ clientId: patch.clientId ? null : previous.clientId })
          .where(eq(activities.projectId, id))
          .run()
      return tx
        .update(projects)
        .set(patch.name === undefined ? patch : { ...patch, nameKey: toNameKey(patch.name) })
        .where(eq(projects.id, id))
        .returning()
        .get()
    })
    notifyTimerChanged()
    return project
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('PROJECT_NAME_TAKEN', String(error))
    throw error
  }
}

export function setProjectArchived(id: number, archived: boolean): Project {
  findProject(id)

  return getActiveDatabase()
    .update(projects)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(projects.id, id))
    .returning()
    .get()
}

export function deleteProject(id: number): void {
  findProject(id)

  const db = getActiveDatabase()
  const hasEntries = db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .where(eq(activities.projectId, id))
    .limit(1)
    .get()
  if (hasEntries) throw new AppError('PROJECT_HAS_TIME_ENTRIES', String(id))

  db.delete(projects).where(eq(projects.id, id)).run()
}

export function initProjects(): void {
  handle('projects:list', z.tuple([listOptions]), (_, options) => listProjects(options))
  handle('projects:get', z.tuple([id]), (_, projectId) => findProject(projectId))
  handle('projects:create', z.tuple([projectInput]), (_, input) => createProject(input))
  handle('projects:update', z.tuple([id, projectInput.partial()]), (_, projectId, patch) =>
    updateProject(projectId, patch)
  )
  handle('projects:setArchived', z.tuple([id, z.boolean()]), (_, projectId, archived) =>
    setProjectArchived(projectId, archived)
  )
  handle('projects:delete', z.tuple([id]), (_, projectId) => deleteProject(projectId))
}
