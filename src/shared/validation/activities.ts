import { z } from 'zod'
import { id, name } from './common'

export const activityInput = z.object({ projectId: id, name })

export const activityListOptions = z
  .object({ projectId: id.optional(), includeArchived: z.boolean().optional() })
  .optional()
