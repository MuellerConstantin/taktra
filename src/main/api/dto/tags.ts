import type { ActivityTag } from '../../../shared/model/activities'
import type { Tag } from '../../../shared/model/tags'

export interface TagV1 {
  readonly id: number
  readonly name: string
  readonly color: string | null
}

export function toTag(tag: Tag | ActivityTag): TagV1 {
  return { id: tag.id, name: tag.name, color: tag.color }
}
