import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { exportTemplates } from '../main/db/schema/exportTemplates'
import type { exportTemplateInput } from './validation/export'

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
  'client',
  'duration_h'
] as const

export type BuiltinExportColumn = (typeof builtinExportColumns)[number]

const durationExportColumns: readonly BuiltinExportColumn[] = ['duration_min', 'duration_h']

/** Columns that differ between single entries, so summed layouts cannot contain them. */
const entryOnlyExportColumns: readonly BuiltinExportColumn[] = ['start', 'end', 'note']

/**
 * Without its own header, a built-in column is headed by its name and a custom field column by
 * the field's name key.
 */
export type ExportColumn = (
  { readonly builtin: BuiltinExportColumn } | { readonly fieldId: number }
) & {
  readonly header?: string | null
}

/** Files without a template keep the columns they had before `duration_h` was added. */
export const defaultExportColumns: readonly ExportColumn[] = builtinExportColumns
  .filter((builtin) => builtin !== 'duration_h')
  .map((builtin) => ({ builtin }))

export type ExportValue = string | number | readonly string[] | null

/** Rows hold their values in the order of the headers; date columns hold ISO dates. */
export interface ExportTable {
  readonly headers: readonly string[]
  readonly isDate: readonly boolean[]
  readonly rows: readonly (readonly ExportValue[])[]
}

export const exportFormats = ['csv', 'json', 'xlsx'] as const

export type ExportFormat = (typeof exportFormats)[number]

/** One row per entry, summed rows, or summed rows with one column per day. */
export const exportLayouts = ['entries', 'summed', 'pivot'] as const

export type ExportLayout = (typeof exportLayouts)[number]

/** Why a layout cannot contain a built-in column, or null if it can. */
export function excludedColumnError(
  layout: ExportLayout,
  builtin: BuiltinExportColumn
): 'EXPORT_COLUMN_NOT_SUMMABLE' | 'EXPORT_DATE_IN_PIVOT' | null {
  if (layout === 'entries') return null
  if (entryOnlyExportColumns.includes(builtin)) return 'EXPORT_COLUMN_NOT_SUMMABLE'
  return layout === 'pivot' && builtin === 'date' ? 'EXPORT_DATE_IN_PIVOT' : null
}

/** Summed layouts need a duration to sum, and days as columns exactly one to fill the days. */
export function durationError(
  layout: ExportLayout,
  columns: readonly ExportColumn[]
): 'EXPORT_DURATION_MISSING' | 'EXPORT_DURATION_TWICE' | null {
  if (layout === 'entries') return null
  const count = columns.filter(
    (column) => 'builtin' in column && durationExportColumns.includes(column.builtin)
  ).length
  if (count === 0) return 'EXPORT_DURATION_MISSING'
  return layout === 'pivot' && count > 1 ? 'EXPORT_DURATION_TWICE' : null
}

export interface ExportPreview extends ExportTable {
  readonly count: number
  readonly totalMin: number
}

export type ExportTemplate = InferSelectModel<typeof exportTemplates> & {
  readonly columns: readonly ExportColumn[]
}

export type ExportTemplateInput = z.input<typeof exportTemplateInput>

export type ExportTemplateData = z.output<typeof exportTemplateInput>
