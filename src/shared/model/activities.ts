import type { z } from 'zod'
import type { activityInput } from '../validation/activities'
import type { Tag } from './tags'

export interface Activity {
  readonly id: number
  readonly projectId: number
  readonly name: string
  readonly clientId: number | null
  readonly archivedAt: Date | null
}

export type ActivityTag = Pick<Tag, 'id' | 'name' | 'color'>

export type ActivityWithTags = Activity & { readonly tagIds: readonly number[] }

export interface ActivityRef {
  readonly id: number
  readonly projectId: number
  readonly name: string
  readonly tags: readonly ActivityTag[]
}

export type ActivityInput = z.input<typeof activityInput>
