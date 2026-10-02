import { eq, isNull, sql } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import type { Project, ProjectInput } from '../shared/projects'
import { normalizeColor } from './colors'
import { getActiveDatabase } from './db/database'
import { isUniqueViolation } from './db/errors'
import { activities, projects, timeEntries } from './db/schema'
import { handle } from './ipc'

interface ListOptions {
  readonly includeArchived?: boolean
}

function normalize(input: Partial<ProjectInput>): Partial<ProjectInput> {
  const optional = (value: string | null | undefined): string | null | undefined =>
    value === undefined ? undefined : value?.trim() || null

  const name = input.name?.trim()
  if (input.name !== undefined && !name)
    throw new AppError('VALIDATION_FAILED', 'Project name must not be empty')

  return {
    name,
    description: optional(input.description),
    color: normalizeColor(input.color)
  }
}

export function findProject(id: number): Project {
  const project = getActiveDatabase().select().from(projects).where(eq(projects.id, id)).get()
  if (!project) throw new AppError('PROJECT_NOT_FOUND', String(id))
  return project
}

export function listProjects({ includeArchived = false }: ListOptions = {}): Project[] {
  return getActiveDatabase()
    .select()
    .from(projects)
    .where(includeArchived ? undefined : isNull(projects.archivedAt))
    .orderBy(sql`lower(${projects.name})`)
    .all()
}

export function createProject(input: ProjectInput): Project {
  const db = getActiveDatabase()
  const { name, ...values } = normalize(input)
  if (!name) throw new AppError('VALIDATION_FAILED', 'Project name must not be empty')

  try {
    return db
      .insert(projects)
      .values({ ...values, name })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('PROJECT_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateProject(id: number, patch: Partial<ProjectInput>): Project {
  findProject(id)

  try {
    return getActiveDatabase()
      .update(projects)
      .set(normalize(patch))
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
  handle('projects:list', (_, options?: ListOptions) => listProjects(options))
  handle('projects:get', (_, id: number) => findProject(id))
  handle('projects:create', (_, input: ProjectInput) => createProject(input))
  handle('projects:update', (_, id: number, patch: Partial<ProjectInput>) =>
    updateProject(id, patch)
  )
  handle('projects:setArchived', (_, id: number, archived: boolean) =>
    setProjectArchived(id, archived)
  )
  handle('projects:delete', (_, id: number) => deleteProject(id))
}
