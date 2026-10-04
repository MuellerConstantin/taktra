/** Column names are part of the file format other systems import, so they never change. */
export const exportColumns = [
  'date',
  'project',
  'activity',
  'tags',
  'start',
  'end',
  'duration_min',
  'note'
] as const

export type ExportColumn = (typeof exportColumns)[number]

export type ExportRow = Readonly<Record<ExportColumn, string | number | null>>

export interface ExportPreview {
  readonly rows: readonly ExportRow[]
  readonly count: number
  readonly totalMin: number
}
