import { z } from 'zod'
import { id, name } from './common'

export const activityInput = z.object({
  projectId: id,
  name,
  customerId: id.nullable().optional()
})

export const activityListOptions = z
  .object({ projectId: id.optional(), includeArchived: z.boolean().optional() })
  .optional()
