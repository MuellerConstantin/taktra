/** Column names are part of the file format other systems import, so they never change. */
export const builtinExportColumns = [
  'date',
  'project',
  'activity',
  'tags',
  'start',
  'end',
  'duration_min',
  'note',
  'client'
] as const

export type BuiltinExportColumn = (typeof builtinExportColumns)[number]

/** A custom field column is headed by the field's name key. */
export type ExportColumn = { readonly builtin: BuiltinExportColumn } | { readonly fieldId: number }

export const defaultExportColumns: readonly ExportColumn[] = builtinExportColumns.map(
  (builtin) => ({ builtin })
)

export type ExportValue = string | number | readonly string[] | null

/** Rows hold their values in the order of the headers. */
export interface ExportTable {
  readonly headers: readonly string[]
  readonly rows: readonly (readonly ExportValue[])[]
}

export const exportFormats = ['csv', 'json'] as const

export type ExportFormat = (typeof exportFormats)[number]

export interface ExportPreview extends ExportTable {
  readonly count: number
  readonly totalMin: number
}
