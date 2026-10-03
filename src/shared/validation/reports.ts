import { z } from 'zod'
import { groupings } from '../reports'
import { id, localDate } from './common'

export const timeFilter = z.object({
  from: localDate.optional(),
  to: localDate.optional(),
  projectIds: z.array(id).optional(),
  activityIds: z.array(id).optional(),
  tagIds: z.array(id).optional()
})

export const grouping = z.array(z.enum(groupings))
