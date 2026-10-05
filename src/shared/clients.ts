import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { clients } from '../main/db/schema/clients'
import type { clientInput } from './validation/clients'

export type Client = InferSelectModel<typeof clients>

export type ClientInput = z.input<typeof clientInput>

export type ClientData = z.output<typeof clientInput>
