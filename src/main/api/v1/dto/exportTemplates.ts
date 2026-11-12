import { z } from '@hono/zod-openapi'
import {
  builtinExportColumns,
  exportAggregations,
  exportFormats,
  exportLayouts,
  type ExportColumn,
  type ExportTemplate
} from '@/shared/model/export'

const columnOptions = {
  header: z.string().nullable(),
  aggregation: z.enum(exportAggregations).nullable()
}

export const ExportColumnV1 = z
  .union([
    z.object({ builtin: z.enum(builtinExportColumns), ...columnOptions }),
    z.object({ fieldId: z.number().int(), ...columnOptions })
  ])
  .openapi('ExportColumn', {
    description: 'A built-in column by its standard name, or a custom field by its id.'
  })

export type ExportColumnV1 = z.infer<typeof ExportColumnV1>

export const ExportTemplateV1 = z
  .object({
    id: z.number().int(),
    name: z.string(),
    format: z.enum(exportFormats),
    layout: z.enum(exportLayouts),
    columns: z.array(ExportColumnV1)
  })
  .openapi('ExportTemplate')

export type ExportTemplateV1 = z.infer<typeof ExportTemplateV1>

function toColumn(column: ExportColumn): ExportColumnV1 {
  const options = { header: column.header ?? null, aggregation: column.aggregation ?? null }
  return 'builtin' in column
    ? { builtin: column.builtin, ...options }
    : { fieldId: column.fieldId, ...options }
}

export function toExportTemplate(template: ExportTemplate): ExportTemplateV1 {
  return {
    id: template.id,
    name: template.name,
    format: template.format,
    layout: template.layout,
    columns: template.columns.map(toColumn)
  }
}
