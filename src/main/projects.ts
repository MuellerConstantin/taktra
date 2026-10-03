import { eq, isNull, sql } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import { z } from 'zod'
import type { Project, ProjectData } from '../shared/projects'
import { id, listOptions, projectInput } from '../shared/validation'
import { getActiveDatabase } from './db/database'
import { isUniqueViolation } from './db/errors'
import { activities, projects, timeEntries } from './db/schema'
import { handle } from './ipc'

export function findProject(id: number): Project {
  const project = getActiveDatabase().select().from(projects).where(eq(projects.id, id)).get()
  if (!project) throw new AppError('PROJECT_NOT_FOUND', String(id))
  return project
}

export function listProjects({
  includeArchived = false
}: z.output<typeof listOptions> = {}): Project[] {
  return getActiveDatabase()
    .select()
    .from(projects)
    .where(includeArchived ? undefined : isNull(projects.archivedAt))
    .orderBy(sql`lower(${projects.name})`)
    .all()
}

export function createProject(input: ProjectData): Project {
  try {
    return getActiveDatabase().insert(projects).values(input).returning().get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('PROJECT_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateProject(id: number, patch: Partial<ProjectData>): Project {
  findProject(id)

  try {
    return getActiveDatabase()
      .update(projects)
      .set(patch)
      .where(eq(projects.id, id))
      .returning()
      .get()
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
