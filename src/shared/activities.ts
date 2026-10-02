import type { InferSelectModel } from 'drizzle-orm'
import type { activities } from '../main/db/schema/activities'
import type { Tag } from './tags'

export type Activity = InferSelectModel<typeof activities>

export type ActivityTag = Pick<Tag, 'id' | 'name' | 'color'>

export type ActivityWithTags = Activity & { readonly tagIds: readonly number[] }

export type ActivitySummary = Activity & {
  readonly tags: readonly ActivityTag[]
  readonly totalSec: number
  readonly entryCount: number
}

export interface ActivityInput {
  readonly projectId: number
  readonly name: string
}
