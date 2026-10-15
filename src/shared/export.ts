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

export interface ExportPreview extends ExportTable {
  readonly count: number
  readonly totalMin: number
}

export type ExportTemplate = InferSelectModel<typeof exportTemplates> & {
  readonly columns: readonly ExportColumn[]
}

export type ExportTemplateInput = z.input<typeof exportTemplateInput>

export type ExportTemplateData = z.output<typeof exportTemplateInput>
