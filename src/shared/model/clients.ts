import type { z } from 'zod'
import type { clientInput } from '../validation/clients'

export interface Client {
  readonly id: number
  readonly name: string
  readonly archivedAt: Date | null
}

export type ClientInput = z.input<typeof clientInput>

export type ClientData = z.output<typeof clientInput>
