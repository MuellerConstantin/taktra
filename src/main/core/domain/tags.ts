import { eq } from 'drizzle-orm'
import { AppError } from '../../../shared/errors'
import { toNameKey } from '../../../shared/names'
import type { Tag, TagData } from '../../../shared/tags'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import { tags } from '../db/schema'
import { notifyChanged } from '../events'
import { sortByName } from './names'

export function findTag(id: number): Tag {
  const tag = getActiveDatabase().select().from(tags).where(eq(tags.id, id)).get()
  if (!tag) throw new AppError('TAG_NOT_FOUND', String(id))
  return tag
}

export function listTags(): Tag[] {
  return sortByName(getActiveDatabase().select().from(tags).all())
}

export function createTag(input: TagData): Tag {
  try {
    return getActiveDatabase()
      .insert(tags)
      .values({ ...input, nameKey: toNameKey(input.name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('TAG_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateTag(id: number, patch: Partial<TagData>): Tag {
  findTag(id)

  try {
    const tag = getActiveDatabase()
      .update(tags)
      .set(patch.name === undefined ? patch : { ...patch, nameKey: toNameKey(patch.name) })
      .where(eq(tags.id, id))
      .returning()
      .get()
    notifyChanged('timer')
    return tag
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('TAG_NAME_TAKEN', String(error))
    throw error
  }
}

export function deleteTag(id: number): void {
  findTag(id)
  getActiveDatabase().delete(tags).where(eq(tags.id, id)).run()
  notifyChanged('timer')
}
