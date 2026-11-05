import { eq } from 'drizzle-orm'
import { AppError } from '@/shared/model/errors'
import { toNameKey } from '@/shared/model/names'
import type { Tag, TagData } from '@/shared/model/tags'
import { getActiveDatabase } from '@/main/core/db/database'
import { isUniqueViolation } from '@/main/core/db/errors'
import { tags } from '@/main/core/db/schema'
import { emit } from '@/main/core/events'
import { sortByName } from './names'

export const tagSelection = {
  id: tags.id,
  name: tags.name,
  color: tags.color
} satisfies Record<keyof Tag, unknown>

export function findTag(id: number): Tag {
  const tag = getActiveDatabase().select(tagSelection).from(tags).where(eq(tags.id, id)).get()
  if (!tag) throw new AppError('TAG_NOT_FOUND', String(id))
  return tag
}

export function listTags(): Tag[] {
  return sortByName(getActiveDatabase().select(tagSelection).from(tags).all())
}

export function createTag(input: TagData): Tag {
  try {
    return getActiveDatabase()
      .insert(tags)
      .values({ ...input, nameKey: toNameKey(input.name) })
      .returning(tagSelection)
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
      .returning(tagSelection)
      .get()
    emit('signal:timer')
    return tag
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('TAG_NAME_TAKEN', String(error))
    throw error
  }
}

export function deleteTag(id: number): void {
  findTag(id)
  getActiveDatabase().delete(tags).where(eq(tags.id, id)).run()
  emit('signal:timer')
}
