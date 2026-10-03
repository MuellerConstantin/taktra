import { eq, sql } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import { z } from 'zod'
import { id, tagInput } from '../shared/validation'
import type { Tag, TagData } from '../shared/tags'
import { getActiveDatabase } from './db/database'
import { isUniqueViolation } from './db/errors'
import { tags } from './db/schema'
import { handle } from './ipc'

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

export function createTag(input: TagData): Tag {
  try {
    return getActiveDatabase().insert(tags).values(input).returning().get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('TAG_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateTag(id: number, patch: Partial<TagData>): Tag {
  findTag(id)

  try {
    return getActiveDatabase().update(tags).set(patch).where(eq(tags.id, id)).returning().get()
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
  handle('tags:list', z.tuple([]), () => listTags())
  handle('tags:get', z.tuple([id]), (_, tagId) => findTag(tagId))
  handle('tags:create', z.tuple([tagInput]), (_, input) => createTag(input))
  handle('tags:update', z.tuple([id, tagInput.partial()]), (_, tagId, patch) =>
    updateTag(tagId, patch)
  )
  handle('tags:delete', z.tuple([id]), (_, tagId) => deleteTag(tagId))
}
