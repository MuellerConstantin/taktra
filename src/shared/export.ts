import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { CustomFieldType } from './customFields'
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

/**
 * How a column fills a summed row: as part of the key that forms the rows, as the sum of its
 * entries, or as the list of their distinct values in the order they first occur.
 */
export const exportAggregations = ['group', 'sum', 'list_distinct'] as const

export type ExportAggregation = (typeof exportAggregations)[number]

/**
 * Without its own header, a built-in column is headed by its name and a custom field column by
 * the field's name key. Without its own aggregation, it has the default of its kind.
 */
export type ExportColumn = (
  { readonly builtin: BuiltinExportColumn } | { readonly fieldId: number }
) & {
  readonly header?: string | null
  readonly aggregation?: ExportAggregation | null
}

/** What the layout rules need to know of a column: custom fields count by their type. */
export type ExportColumnKind =
  { readonly builtin: BuiltinExportColumn } | { readonly fieldType: CustomFieldType }

/**
 * Aggregations a kind allows in summed layouts, its default first. Columns without any differ
 * per entry and fit single entries only. Custom fields belong to an owner, not to the entry, so
 * a sum over entries would count an owner's value once per entry.
 */
const builtinAggregations: Record<BuiltinExportColumn, readonly ExportAggregation[]> = {
  date: ['group'],
  project: ['group', 'list_distinct'],
  activity: ['group', 'list_distinct'],
  tags: ['group', 'list_distinct'],
  start: [],
  end: [],
  duration_min: ['sum'],
  note: ['list_distinct'],
  client: ['group', 'list_distinct'],
  duration_h: ['sum']
}

const fieldAggregations: Record<CustomFieldType, readonly ExportAggregation[]> = {
  text: ['group', 'list_distinct'],
  select: ['group', 'list_distinct']
}

export function allowedAggregations(kind: ExportColumnKind): readonly ExportAggregation[] {
  return 'builtin' in kind ? builtinAggregations[kind.builtin] : fieldAggregations[kind.fieldType]
}

/** The aggregation of a column in summed layouts, or null if it fits single entries only. */
export function columnAggregation(
  column: ExportColumn,
  kind: ExportColumnKind
): ExportAggregation | null {
  return column.aggregation ?? allowedAggregations(kind)[0] ?? null
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

/**
 * Why a layout cannot contain a column, or null if it can. Single entries ignore the
 * aggregation, but keep it, so it is still checked there.
 */
export function columnError(
  layout: ExportLayout,
  column: ExportColumn,
  kind: ExportColumnKind
): 'EXPORT_AGGREGATION_NOT_ALLOWED' | 'EXPORT_COLUMN_NOT_SUMMABLE' | 'EXPORT_DATE_IN_PIVOT' | null {
  const allowed = allowedAggregations(kind)
  if (column.aggregation && !allowed.includes(column.aggregation)) {
    return 'EXPORT_AGGREGATION_NOT_ALLOWED'
  }
  if (layout === 'entries') return null
  if (allowed.length === 0) return 'EXPORT_COLUMN_NOT_SUMMABLE'
  return layout === 'pivot' && 'builtin' in kind && kind.builtin === 'date'
    ? 'EXPORT_DATE_IN_PIVOT'
    : null
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
  readonly rowCount: number
  readonly totalMin: number
}

export type ExportTemplate = InferSelectModel<typeof exportTemplates> & {
  readonly columns: readonly ExportColumn[]
}

export type ExportTemplateInput = z.input<typeof exportTemplateInput>

export type ExportTemplateData = z.output<typeof exportTemplateInput>
