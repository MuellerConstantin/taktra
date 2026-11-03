import type { z } from 'zod'
import type { tagInput } from '../validation/tags'

export interface Tag {
  readonly id: number
  readonly name: string
  readonly color: string | null
}

export type TagInput = z.input<typeof tagInput>

export type TagData = z.output<typeof tagInput>
