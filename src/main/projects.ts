import { eq, isNull, sql } from 'drizzle-orm'
import { ipcMain } from 'electron'
import type { Project, ProjectInput, ProjectResult } from '../shared/projects'
import { getActiveDatabase } from './db/database'
import { projects } from './db/schema'

interface ListOptions {
  readonly includeArchived?: boolean
}

function isUniqueViolation(error: unknown): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ((current as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') return true
  }
  return false
}

function normalize(input: Partial<ProjectInput>): Partial<ProjectInput> {
  const optional = (value: string | null | undefined): string | null | undefined =>
    value === undefined ? undefined : value?.trim() || null

  const name = input.name?.trim()
  if (input.name !== undefined && !name) throw new Error('Project name must not be empty')

  return {
    name,
    description: optional(input.description),
    color: optional(input.color)
  }
}

function findProject(id: number): Project {
  const project = getActiveDatabase().select().from(projects).where(eq(projects.id, id)).get()
  if (!project) throw new Error(`Unknown project: ${id}`)
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

export function createProject(input: ProjectInput): ProjectResult {
  const db = getActiveDatabase()
  const { name, ...values } = normalize(input)
  if (!name) throw new Error('Project name must not be empty')

  try {
    const project = db
      .insert(projects)
      .values({ ...values, name })
      .returning()
      .get()
    return { status: 'ok', project }
  } catch (error) {
    if (isUniqueViolation(error)) return { status: 'nameTaken' }
    throw error
  }
}

export function updateProject(id: number, patch: Partial<ProjectInput>): ProjectResult {
  findProject(id)

  try {
    const project = getActiveDatabase()
      .update(projects)
      .set(normalize(patch))
      .where(eq(projects.id, id))
      .returning()
      .get()
    return { status: 'ok', project }
  } catch (error) {
    if (isUniqueViolation(error)) return { status: 'nameTaken' }
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
  getActiveDatabase().delete(projects).where(eq(projects.id, id)).run()
}

export function initProjects(): void {
  ipcMain.handle('projects:list', (_, options?: ListOptions) => listProjects(options))
  ipcMain.handle('projects:create', (_, input: ProjectInput) => createProject(input))
  ipcMain.handle('projects:update', (_, id: number, patch: Partial<ProjectInput>) =>
    updateProject(id, patch)
  )
  ipcMain.handle('projects:setArchived', (_, id: number, archived: boolean) =>
    setProjectArchived(id, archived)
  )
  ipcMain.handle('projects:delete', (_, id: number) => deleteProject(id))
}
