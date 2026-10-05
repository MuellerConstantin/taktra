import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { customers } from '../main/db/schema/customers'
import type { customerInput } from './validation/customers'

export type Customer = InferSelectModel<typeof customers>

export type CustomerInput = z.input<typeof customerInput>

export type CustomerData = z.output<typeof customerInput>
