import { z } from 'zod'
import { builtinExportColumns, exportFormats } from '../export'
import { id } from './common'

export const exportFormat = z.enum(exportFormats)

export const exportColumns = z
  .array(
    z.union([
      z.strictObject({ builtin: z.enum(builtinExportColumns) }),
      z.strictObject({ fieldId: id })
    ])
  )
  .min(1)
  .optional()
