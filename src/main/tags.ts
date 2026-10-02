import { eq, sql } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import type { Tag, TagInput } from '../shared/tags'
import { normalizeColor } from './colors'
import { getActiveDatabase } from './db/database'
import { isUniqueViolation } from './db/errors'
import { tags } from './db/schema'
import { handle } from './ipc'

function normalize(input: Partial<TagInput>): Partial<TagInput> {
  const name = input.name?.trim()
  if (input.name !== undefined && !name)
    throw new AppError('VALIDATION_FAILED', 'Tag name must not be empty')

  return { name, color: normalizeColor(input.color) }
}

function findTag(id: number): Tag {
  const tag = getActiveDatabase().select().from(tags).where(eq(tags.id, id)).get()
  if (!tag) throw new AppError('TAG_NOT_FOUND', String(id))
  return tag
}

export function listTags(): Tag[] {
  return getActiveDatabase()
    .select()
    .from(tags)
    .orderBy(sql`lower(${tags.name})`)
    .all()
}

export function createTag(input: TagInput): Tag {
  const { name, ...values } = normalize(input)
  if (!name) throw new AppError('VALIDATION_FAILED', 'Tag name must not be empty')

  try {
    return getActiveDatabase()
      .insert(tags)
      .values({ ...values, name })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('TAG_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateTag(id: number, patch: Partial<TagInput>): Tag {
  findTag(id)

  try {
    return getActiveDatabase()
      .update(tags)
      .set(normalize(patch))
      .where(eq(tags.id, id))
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('TAG_NAME_TAKEN', String(error))
    throw error
  }
}

export function deleteTag(id: number): void {
  findTag(id)
  getActiveDatabase().delete(tags).where(eq(tags.id, id)).run()
}

export function initTags(): void {
  handle('tags:list', () => listTags())
  handle('tags:get', (_, id: number) => findTag(id))
  handle('tags:create', (_, input: TagInput) => createTag(input))
  handle('tags:update', (_, id: number, patch: Partial<TagInput>) => updateTag(id, patch))
  handle('tags:delete', (_, id: number) => deleteTag(id))
}
