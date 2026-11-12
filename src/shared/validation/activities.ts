import { z } from 'zod'
import { MAX_NAME_LENGTH } from '../model/limits'
import { normalizeName } from '../model/names'
import { id, name } from './common'

export const activityInput = z.object({
  projectId: id,
  name,
  clientId: id.nullable().optional()
})

export const activityListOptions = z
  .object({
    projectId: id.optional(),
    includeArchived: z.boolean().optional(),
    // Searches the names of the activity and its project, so it may be as long as both.
    search: z
      .string()
      .overwrite(normalizeName)
      .max(MAX_NAME_LENGTH * 2 + 1)
      .optional()
  })
  .optional()
