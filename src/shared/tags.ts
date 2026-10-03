import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { tags } from '../main/db/schema/tags'
import type { tagInput } from './validation/tags'

export type Tag = InferSelectModel<typeof tags>

export type TagInput = z.input<typeof tagInput>

export type TagData = z.output<typeof tagInput>
