import { z } from '@hono/zod-openapi'
import type { ActivityTag } from '@/shared/model/activities'
import type { Tag } from '@/shared/model/tags'

export const TagV1 = z
  .object({
    id: z.number().int(),
    name: z.string(),
    color: z.string().nullable().openapi({ example: '#22c55e' })
  })
  .openapi('Tag')

export type TagV1 = z.infer<typeof TagV1>

export function toTag(tag: Tag | ActivityTag): TagV1 {
  return { id: tag.id, name: tag.name, color: tag.color }
}
