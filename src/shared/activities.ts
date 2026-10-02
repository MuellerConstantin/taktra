import type { InferSelectModel } from 'drizzle-orm'
import type { activities } from '../main/db/schema/activities'

export type Activity = InferSelectModel<typeof activities>

export interface ActivityInput {
  readonly projectId: number
  readonly name: string
}
