import { z } from 'zod'
import { color, emptyToNull, id, name } from './common'
import { MAX_DESCRIPTION_LENGTH } from './limits'

const description = z.string().trim().max(MAX_DESCRIPTION_LENGTH).transform(emptyToNull).nullable()

export const projectInput = z.object({
  name,
  description: description.optional(),
  color: color.optional(),
  clientId: id.nullable().optional()
})
