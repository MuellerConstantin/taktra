import type { InferSelectModel } from 'drizzle-orm'
import type { tags } from '../main/db/schema/tags'

export type Tag = InferSelectModel<typeof tags>

export interface TagInput {
  readonly name: string
  readonly color?: string | null
}
