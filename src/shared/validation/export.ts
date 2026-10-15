import { z } from 'zod'
import { builtinExportColumns, exportFormats, exportLayouts } from '../export'
import { normalizeName } from '../names'
import { emptyToNull, id, name } from './common'
import { MAX_EXPORT_COLUMNS, MAX_NAME_LENGTH } from './limits'

export const exportFormat = z.enum(exportFormats)

export const exportLayout = z.enum(exportLayouts)

const header = z
  .string()
  .overwrite(normalizeName)
  .max(MAX_NAME_LENGTH)
  .transform(emptyToNull)
  .nullish()

const exportColumnList = z
  .array(
    z.union([
      z.strictObject({ builtin: z.enum(builtinExportColumns), header }),
      z.strictObject({ fieldId: id, header })
    ])
  )
  .min(1)
  .max(MAX_EXPORT_COLUMNS)

export const exportColumns = exportColumnList.optional()

export const exportTemplateInput = z.object({
  name,
  format: exportFormat,
  layout: exportLayout,
  columns: exportColumnList
})
