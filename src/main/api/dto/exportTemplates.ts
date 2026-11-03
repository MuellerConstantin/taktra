import type {
  BuiltinExportColumn,
  ExportAggregation,
  ExportColumn,
  ExportFormat,
  ExportLayout,
  ExportTemplate
} from '../../../shared/model/export'

/** A built-in column by its standard name, or a custom field by its id. */
export type ExportColumnV1 = (
  { readonly builtin: BuiltinExportColumn } | { readonly fieldId: number }
) & {
  readonly header: string | null
  readonly aggregation: ExportAggregation | null
}

export interface ExportTemplateV1 {
  readonly id: number
  readonly name: string
  readonly format: ExportFormat
  readonly layout: ExportLayout
  readonly columns: readonly ExportColumnV1[]
}

function toColumn(column: ExportColumn): ExportColumnV1 {
  const source = 'builtin' in column ? { builtin: column.builtin } : { fieldId: column.fieldId }
  return { ...source, header: column.header ?? null, aggregation: column.aggregation ?? null }
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
