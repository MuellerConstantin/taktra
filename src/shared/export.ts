/** Column names are part of the file format other systems import, so they never change. */
export const exportColumns = [
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

export type ExportColumn = (typeof exportColumns)[number]

export interface ExportRow {
  readonly date: string
  readonly project: string
  readonly activity: string
  readonly tags: readonly string[]
  readonly start: string | null
  readonly end: string | null
  readonly duration_min: number
  readonly note: string | null
  readonly client: string | null
}

export const exportFormats = ['csv', 'json'] as const

export type ExportFormat = (typeof exportFormats)[number]

export interface ExportPreview {
  readonly rows: readonly ExportRow[]
  readonly count: number
  readonly totalMin: number
}
