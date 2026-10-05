import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { activities } from '../main/db/schema/activities'
import type { activityInput } from './validation/activities'
import type { Tag } from './tags'

export type Activity = InferSelectModel<typeof activities>

export type ActivityTag = Pick<Tag, 'id' | 'name' | 'color'>

export type ActivityWithTags = Activity & { readonly tagIds: readonly number[] }

export interface ActivityRef {
  readonly id: number
  readonly projectId: number
  readonly name: string
  readonly tags: readonly ActivityTag[]
}

export type ActivityInput = z.input<typeof activityInput>
