import type { z } from 'zod'
import type { projectInput } from '../validation/projects'

export interface Project {
  readonly id: number
  readonly name: string
  readonly description: string | null
  readonly color: string | null
  readonly clientId: number | null
  readonly archivedAt: Date | null
}

export type ProjectInput = z.input<typeof projectInput>

export type ProjectData = z.output<typeof projectInput>
