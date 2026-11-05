import { z } from 'zod'
import { id, tagInput } from '@/shared/validation'
import { tags } from '@/main/core'
import { handle } from './handle'

export function registerTagsHandlers(): void {
  handle('tags:list', z.tuple([]), () => tags.list())
  handle('tags:get', z.tuple([id]), (_, tagId) => tags.get(tagId))
  handle('tags:create', z.tuple([tagInput]), (_, input) => tags.create(input))
  handle('tags:update', z.tuple([id, tagInput.partial()]), (_, tagId, patch) =>
    tags.update(tagId, patch)
  )
  handle('tags:delete', z.tuple([id]), (_, tagId) => tags.delete(tagId))
}
