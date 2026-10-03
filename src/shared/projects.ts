import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { projects } from '../main/db/schema/projects'
import type { projectInput } from './validation/projects'

export type Project = InferSelectModel<typeof projects>

export type ProjectInput = z.input<typeof projectInput>

export type ProjectData = z.output<typeof projectInput>
