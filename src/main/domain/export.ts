import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stringify } from 'csv-stringify/sync'
import { and, isNotNull } from 'drizzle-orm'
import { app, BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import type { CustomField } from '../../shared/customFields'
import { AppError } from '../../shared/errors'
import {
  defaultExportColumns,
  type BuiltinExportColumn,
  type ExportColumn,
  type ExportFormat,
  type ExportPreview,
  type ExportTable,
  type ExportValue
} from '../../shared/export'
import type { TimeFilter } from '../../shared/reports'
import type { TimeEntryDetails } from '../../shared/timeEntries'
import { exportColumns, exportFormat, timeFilter } from '../../shared/validation'
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
  client: ({ client }) => client?.name ?? null
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
  readonly valueOf: ValueOf
}

/** Headers must be unique, because JSON keys and CSV importers could not tell the columns apart. */
function resolveColumns(columns: readonly ExportColumn[]): ResolvedColumn[] {
  const resolved = columns.map((column) => {
    if ('builtin' in column)
      return { header: column.builtin, valueOf: builtinValues[column.builtin] }
    const field = findCustomField(column.fieldId)
    return { header: field.nameKey, valueOf: fieldValues(field) }
  })
  const headers = resolved.map((column) => column.header)
  const conflict = headers.find((header, index) => headers.indexOf(header) !== index)
  if (conflict !== undefined) throw new AppError('EXPORT_COLUMN_CONFLICT', conflict)
  return resolved
}

/** Completed entries matching the filter; a running timer is left out. */
function listCompletedEntries(filter: TimeFilter): TimeEntryDetails[] {
  return selectTimeEntryDetails(and(conditions(filter), isNotNull(timeEntries.durationSec)))
}

function toTable(
  entries: readonly TimeEntryDetails[],
  columns: readonly ResolvedColumn[]
): ExportTable {
  return {
    headers: columns.map((column) => column.header),
    rows: entries.map((details) => columns.map((column) => column.valueOf(details)))
  }
}

/** RFC 4180: comma, quoted fields where needed, CRLF line endings, no BOM. */
export function toCsv({ headers, rows }: ExportTable): string {
  return stringify(
    [
      headers,
      ...rows.map((row) => row.map((value) => (Array.isArray(value) ? value.join(', ') : value)))
    ],
    { record_delimiter: 'windows' }
  )
}

/** An array of entries with the CSV headers as keys, in the same order; no BOM. */
export function toJson({ headers, rows }: ExportTable): string {
  const entries = rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  )
  return `${JSON.stringify(entries, null, 2)}
`
}

const writers: Record<
  ExportFormat,
  { readonly name: string; readonly write: (table: ExportTable) => string }
> = {
  csv: { name: 'CSV', write: toCsv },
  json: { name: 'JSON', write: toJson }
}

export function previewExport(
  filter: TimeFilter,
  columns: readonly ExportColumn[] = defaultExportColumns
): ExportPreview {
  const resolved = resolveColumns(columns)
  const entries = listCompletedEntries(filter)
  return {
    ...toTable(entries.slice(0, PREVIEW_ROWS), resolved),
    count: entries.length,
    totalMin: entries.reduce((sum, details) => sum + durationMin(details), 0)
  }
}

function defaultFileName({ from, to }: TimeFilter, format: ExportFormat): string {
  return from && to ? `taktra_${from}_${to}.${format}` : `taktra.${format}`
}

async function exportFile(
  window: BrowserWindow | null,
  filter: TimeFilter,
  format: ExportFormat,
  columns: readonly ExportColumn[] = defaultExportColumns
): Promise<string | null> {
  // Resolved before the dialog, so a column conflict is reported before a file is chosen.
  const resolved = resolveColumns(columns)
  const writer = writers[format]
  const options = {
    defaultPath: join(app.getPath('downloads'), defaultFileName(filter, format)),
    filters: [{ name: writer.name, extensions: [format] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null

  const content = writer.write(toTable(listCompletedEntries(filter), resolved))
  try {
    await writeFile(result.filePath, content, 'utf8')
  } catch (error) {
    throw new AppError('EXPORT_WRITE_FAILED', String(error))
  }
  return result.filePath
}

export function initExport(): void {
  handle('export:preview', z.tuple([timeFilter, exportColumns]), (_, filter, columns) =>
    previewExport(filter, columns)
  )
  handle(
    'export:file',
    z.tuple([timeFilter, exportFormat, exportColumns]),
    (event, filter, format, columns) =>
      exportFile(BrowserWindow.fromWebContents(event.sender), filter, format, columns)
  )
}
