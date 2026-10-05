import { z } from 'zod'
import { name } from './common'

export const customerInput = z.object({ name })
