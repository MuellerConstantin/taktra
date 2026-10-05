import { z } from 'zod'
import { name } from './common'

export const clientInput = z.object({ name })
