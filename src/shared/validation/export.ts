import { z } from 'zod'
import { exportFormats } from '../export'

export const exportFormat = z.enum(exportFormats)
