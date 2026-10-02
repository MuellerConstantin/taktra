import type { InferSelectModel } from 'drizzle-orm'
import type { projects } from '../main/db/schema/projects'

export type Project = InferSelectModel<typeof projects>

export interface ProjectInput {
  readonly name: string
  readonly description?: string | null
  readonly color?: string | null
}
