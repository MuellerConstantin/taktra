import { z } from 'zod'
import { color, name } from './common'

export const tagInput = z.object({ name, color: color.optional() })
