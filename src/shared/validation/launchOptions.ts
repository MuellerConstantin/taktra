import { z } from 'zod'
import { id } from './common'

export const launchOptions = z.object({
  startActivity: z.string().regex(/^\d+$/).transform(Number).pipe(id).optional(),
  stopTimer: z.boolean().optional()
})
