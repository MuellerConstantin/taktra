import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stringify } from 'csv-stringify/sync'
import { and, isNotNull } from 'drizzle-orm'
import { app, BrowserWindow, dialog } from 'electron'
import writeXlsxFile, { type Cell } from 'write-excel-file/node'
import { z } from 'zod'
import type { CustomField } from '../../shared/customFields'
import { AppError } from '../../shared/errors'
import { toNameKey } from '../../shared/names'
import {
  columnAggregation,
  columnError,
  defaultExportColumns,
  durationError,
  type BuiltinExportColumn,
  type ExportAggregation,
  type ExportColumn,
  type ExportColumnKind,
  type ExportFormat,
  type ExportLayout,
  type ExportPreview,
  type ExportTable,
  type ExportValue
} from '../../shared/export'
import type { TimeFilter } from '../../shared/reports'
import type { TimeEntryDetails } from '../../shared/timeEntries'
import { exportColumns, exportFormat, exportLayout, timeFilter } from '../../shared/validation'
import { timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { findCustomField, listFieldValueTexts } from './customFields'
import { conditions } from './reports'
import { selectTimeEntryDetails } from './timeEntries'

const PREVIEW_ROWS = 10

const timeFormats = new Map<string, Intl.DateTimeFormat>()

function formatTime(date: Date, timeZone: string): string {
  const format =
    timeFormats.get(timeZone) ??
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
  timeFormats.set(timeZone, format)
  return format.format(date)
}

function durationMin({ entry }: TimeEntryDetails): number {
  return Math.round((entry.durationSec ?? 0) / 60)
}

function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

/** Summed rows add up whole minutes first and convert the sum, so no rounding adds up. */
const durationsFromMinutes: Partial<Record<BuiltinExportColumn, (minutes: number) => number>> = {
  duration_min: (minutes) => minutes,
  duration_h: toHours
}

type ValueOf = (details: TimeEntryDetails) => ExportValue

const builtinValues: Record<BuiltinExportColumn, ValueOf> = {
  date: ({ entry }) => entry.date,
  project: ({ project }) => project.name,
  activity: ({ activity }) => activity.name,
  tags: ({ tags }) => tags.map((tag) => tag.name),
  // Clock times in the timezone the entry was recorded in, like its date.
  start: ({ entry }) =>
    entry.startedAt && entry.timezone ? formatTime(entry.startedAt, entry.timezone) : null,
  end: ({ entry }) =>
    entry.endedAt && entry.timezone ? formatTime(entry.endedAt, entry.timezone) : null,
  duration_min: durationMin,
  note: ({ entry }) => entry.note,
  client: ({ client }) => client?.name ?? null,
  duration_h: (details) => toHours(durationMin(details))
}

const fieldOwners: Record<CustomField['scope'], (details: TimeEntryDetails) => number | null> = {
  project: ({ project }) => project.id,
  client: ({ client }) => client?.id ?? null,
  activity: ({ activity }) => activity.id
}

function fieldValues(field: CustomField): ValueOf {
  const values = listFieldValueTexts(field)
  const ownerOf = fieldOwners[field.scope]
  return (details) => {
    const ownerId = ownerOf(details)
    return ownerId === null ? null : (values.get(ownerId) ?? null)
  }
}

interface ResolvedColumn {
  readonly header: string
  readonly isDate: boolean
  readonly valueOf: ValueOf
  readonly fromMinutes: ((minutes: number) => number) | null
  readonly aggregation: ExportAggregation | null
}

function defaultHeader(column: ExportColumn): string {
  return 'builtin' in column ? column.builtin : findCustomField(column.fieldId).nameKey
}

/**
 * Headers are compared like names and must be unique, because JSON keys and CSV importers could
 * not tell the columns apart.
 */
export function resolveHeaders(columns: readonly ExportColumn[]): string[] {
  const headers = columns.map((column) => column.header ?? defaultHeader(column))
  const keys = headers.map(toNameKey)
  const conflict = keys.find((key, index) => keys.indexOf(key) !== index)
  if (conflict !== undefined) throw new AppError('EXPORT_COLUMN_CONFLICT', conflict)
  return headers
}

function kindOf(column: ExportColumn): ExportColumnKind {
  return 'builtin' in column ? column : { fieldType: findCustomField(column.fieldId).type }
}

export function checkLayout(layout: ExportLayout, columns: readonly ExportColumn[]): void {
  for (const column of columns) {
    const error = columnError(layout, column, kindOf(column))
    if (error) throw new AppError(error, 'builtin' in column ? column.builtin : undefined)
  }
  const error = durationError(layout, columns)
  if (error) throw new AppError(error)
}

function resolveColumns(columns: readonly ExportColumn[], layout: ExportLayout): ResolvedColumn[] {
  const headers = resolveHeaders(columns)
  checkLayout(layout, columns)
  return columns.map((column, index) => ({
    header: headers[index],
    isDate: 'builtin' in column && column.builtin === 'date',
    valueOf:
      'builtin' in column
        ? builtinValues[column.builtin]
        : fieldValues(findCustomField(column.fieldId)),
    fromMinutes: ('builtin' in column && durationsFromMinutes[column.builtin]) || null,
    aggregation: columnAggregation(column, kindOf(column))
  }))
}

/** Completed entries matching the filter; a running timer is left out. */
function listCompletedEntries(filter: TimeFilter): TimeEntryDetails[] {
  return selectTimeEntryDetails(and(conditions(filter), isNotNull(timeEntries.durationSec)))
}

function totalMinutes(entries: readonly TimeEntryDetails[]): number {
  return entries.reduce((sum, details) => sum + durationMin(details), 0)
}

/** Distinct values in the order they first occur; lists such as tags add their items. */
function listDistinct(column: ResolvedColumn, entries: readonly TimeEntryDetails[]): string[] {
  const values = entries.flatMap((details) => {
    const value = column.valueOf(details)
    if (value === null) return []
    return typeof value === 'object' ? value : [String(value)]
  })
  return [...new Set(values)]
}

const aggregate: Record<
  ExportAggregation,
  (column: ResolvedColumn, entries: readonly TimeEntryDetails[]) => ExportValue
> = {
  group: (column, [first]) => column.valueOf(first),
  sum: (column, entries) => {
    if (!column.fromMinutes) throw new AppError('EXPORT_AGGREGATION_NOT_ALLOWED', column.header)
    return column.fromMinutes(totalMinutes(entries))
  },
  list_distinct: listDistinct
}

function aggregateColumn(
  column: ResolvedColumn,
  entries: readonly TimeEntryDetails[]
): ExportValue {
  if (!column.aggregation) throw new AppError('EXPORT_COLUMN_NOT_SUMMABLE', column.header)
  return aggregate[column.aggregation](column, entries)
}

/** Entries with the same values in the grouped columns, in the order the groups first occur. */
function groupEntries(
  entries: readonly TimeEntryDetails[],
  columns: readonly ResolvedColumn[]
): TimeEntryDetails[][] {
  const keyColumns = columns.filter((column) => column.aggregation === 'group')
  const groups = new Map<string, TimeEntryDetails[]>()
  for (const details of entries) {
    const id = JSON.stringify(keyColumns.map((column) => column.valueOf(details)))
    const group = groups.get(id)
    if (group) group.push(details)
    else groups.set(id, [details])
  }
  return [...groups.values()]
}

function sumRows(
  entries: readonly TimeEntryDetails[],
  columns: readonly ResolvedColumn[]
): ExportValue[][] {
  return groupEntries(entries, columns).map((group) =>
    columns.map((column) => aggregateColumn(column, group))
  )
}

/** Every day of the filter, or of the entries where the filter leaves the range open. */
function listDays(entries: readonly TimeEntryDetails[], { from, to }: TimeFilter): string[] {
  const first = from ?? entries[0]?.entry.date
  const last = to ?? entries.at(-1)?.entry.date
  if (!first || !last) return []
  const days: string[] = []
  for (
    const day = new Date(`${first}T00:00:00Z`);
    day.toISOString().slice(0, 10) <= last;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    days.push(day.toISOString().slice(0, 10))
  }
  return days
}

/** Summed rows of the other columns, with one column per day where the duration column stands. */
function toPivotTable(
  entries: readonly TimeEntryDetails[],
  columns: readonly ResolvedColumn[],
  days: readonly string[]
): ExportTable {
  const durationIndex = columns.findIndex((column) => column.fromMinutes)
  const fromMinutes = columns[durationIndex]?.fromMinutes
  if (!fromMinutes) throw new AppError('EXPORT_DURATION_MISSING')
  const otherColumns = columns.filter((column) => !column.fromMinutes)

  const otherHeaders = new Set(otherColumns.map((column) => toNameKey(column.header)))
  const conflict = days.find((day) => otherHeaders.has(toNameKey(day)))
  if (conflict !== undefined) throw new AppError('EXPORT_COLUMN_CONFLICT', conflict)

  const withDays = <T>(values: readonly T[], dayValues: readonly T[]): T[] => [
    ...values.slice(0, durationIndex),
    ...dayValues,
    ...values.slice(durationIndex)
  ]
  return {
    headers: withDays(
      otherColumns.map((column) => column.header),
      days
    ),
    isDate: withDays(
      otherColumns.map((column) => column.isDate),
      days.map(() => false)
    ),
    rows: groupEntries(entries, columns).map((group) =>
      withDays(
        otherColumns.map((column) => aggregateColumn(column, group)),
        days.map((day) => {
          const onDay = group.filter((details) => details.entry.date === day)
          return onDay.length === 0 ? null : fromMinutes(totalMinutes(onDay))
        })
      )
    )
  }
}

function toTable(
  entries: readonly TimeEntryDetails[],
  columns: readonly ResolvedColumn[],
  layout: ExportLayout,
  filter: TimeFilter
): ExportTable {
  if (layout === 'pivot') return toPivotTable(entries, columns, listDays(entries, filter))
  return {
    headers: columns.map((column) => column.header),
    isDate: columns.map((column) => column.isDate),
    rows:
      layout === 'entries'
        ? entries.map((details) => columns.map((column) => column.valueOf(details)))
        : sumRows(entries, columns)
  }
}

/** Lists such as tags become one comma-separated text, for formats with a single value per cell. */
function toCellValue(value: ExportValue): string | number | null {
  return value !== null && typeof value === 'object' ? value.join(', ') : value
}

/** RFC 4180: comma, quoted fields where needed, CRLF line endings, no BOM. */
export function toCsv({ headers, rows }: ExportTable): string {
  return stringify([headers, ...rows.map((row) => row.map(toCellValue))], {
    record_delimiter: 'windows',
    // csv-stringify only quotes the full record delimiter, not a lone LF or CR as in notes.
    quoted_match: /[\r\n]/
  })
}

/** An array of entries with the CSV headers as keys, in the same order; no BOM. */
export function toJson({ headers, rows }: ExportTable): string {
  const entries = rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  )
  return `${JSON.stringify(entries, null, 2)}
`
}

const XLSX_MAX_WIDTH = 60

/** Dates as date cells and durations as numbers, so spreadsheets can sort and sum them. */
export function toXlsx({ headers, isDate, rows }: ExportTable): Promise<Buffer> {
  const values = rows.map((row) => row.map(toCellValue))
  const widths = headers.map((header, index) =>
    values.reduce((width, row) => Math.max(width, String(row[index] ?? '').length), header.length)
  )
  const cells = values.map((row) =>
    row.map((value, index): Cell =>
      isDate[index] && typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : value
    )
  )
  return writeXlsxFile([headers.map((value): Cell => ({ value, fontWeight: 'bold' })), ...cells], {
    dateFormat: 'yyyy-mm-dd',
    stickyRowsCount: 1,
    columns: widths.map((width) => ({ width: Math.min(width + 2, XLSX_MAX_WIDTH) }))
  }).toBuffer()
}

const writers: Record<
  ExportFormat,
  {
    readonly name: string
    readonly write: (table: ExportTable) => string | Promise<Buffer>
  }
> = {
  csv: { name: 'CSV', write: toCsv },
  json: { name: 'JSON', write: toJson },
  xlsx: { name: 'Excel', write: toXlsx }
}

export function previewExport(
  filter: TimeFilter,
  columns: readonly ExportColumn[] = defaultExportColumns,
  layout: ExportLayout = 'entries'
): ExportPreview {
  const resolved = resolveColumns(columns, layout)
  const entries = listCompletedEntries(filter)
  const table = toTable(
    layout === 'entries' ? entries.slice(0, PREVIEW_ROWS) : entries,
    resolved,
    layout,
    filter
  )
  return {
    ...table,
    rows: table.rows.slice(0, PREVIEW_ROWS),
    count: entries.length,
    rowCount: layout === 'entries' ? entries.length : table.rows.length,
    totalMin: totalMinutes(entries)
  }
}

function defaultFileName({ from, to }: TimeFilter, format: ExportFormat): string {
  return from && to ? `taktra_${from}_${to}.${format}` : `taktra.${format}`
}

async function exportFile(
  window: BrowserWindow | null,
  filter: TimeFilter,
  format: ExportFormat,
  columns: readonly ExportColumn[] = defaultExportColumns,
  layout: ExportLayout = 'entries'
): Promise<string | null> {
  // Built before the dialog, so a column conflict is reported before a file is chosen.
  const table = toTable(
    listCompletedEntries(filter),
    resolveColumns(columns, layout),
    layout,
    filter
  )
  const writer = writers[format]
  const options = {
    defaultPath: join(app.getPath('downloads'), defaultFileName(filter, format)),
    filters: [{ name: writer.name, extensions: [format] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null

  const content = await writer.write(table)
  try {
    await writeFile(result.filePath, content, 'utf8')
  } catch (error) {
    throw new AppError('EXPORT_WRITE_FAILED', String(error))
  }
  return result.filePath
}

export function initExport(): void {
  handle(
    'export:preview',
    z.tuple([timeFilter, exportColumns, exportLayout.optional()]),
    (_, filter, columns, layout) => previewExport(filter, columns, layout)
  )
  handle(
    'export:file',
    z.tuple([timeFilter, exportFormat, exportColumns, exportLayout.optional()]),
    (event, filter, format, columns, layout) =>
      exportFile(BrowserWindow.fromWebContents(event.sender), filter, format, columns, layout)
  )
}
