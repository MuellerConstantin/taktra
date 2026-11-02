import { z } from 'zod'
import { id, tagInput } from '../../../shared/validation'
import { createTag, deleteTag, findTag, listTags, updateTag } from '../../core/domain/tags'
import { handle } from './handle'

export function initTags(): void {
  handle('tags:list', z.tuple([]), () => listTags())
  handle('tags:get', z.tuple([id]), (_, tagId) => findTag(tagId))
  handle('tags:create', z.tuple([tagInput]), (_, input) => createTag(input))
  handle('tags:update', z.tuple([id, tagInput.partial()]), (_, tagId, patch) =>
    updateTag(tagId, patch)
  )
  handle('tags:delete', z.tuple([id]), (_, tagId) => deleteTag(tagId))
}
