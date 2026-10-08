import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stringify } from 'csv-stringify/sync'
import { and, isNotNull } from 'drizzle-orm'
import { app, BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import { AppError } from '../../shared/errors'
import {
  exportColumns,
  type ExportFormat,
  type ExportPreview,
  type ExportRow
} from '../../shared/export'
import type { TimeFilter } from '../../shared/reports'
import type { TimeEntryDetails } from '../../shared/timeEntries'
import { exportFormat, timeFilter } from '../../shared/validation'
import { timeEntries } from '../db/schema'
import { handle } from '../ipc'
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

function toExportRow({ entry, project, activity, client, tags }: TimeEntryDetails): ExportRow {
  const { startedAt, endedAt, timezone } = entry
  return {
    date: entry.date,
    project: project.name,
    activity: activity.name,
    tags: tags.map((tag) => tag.name),
    // Clock times in the timezone the entry was recorded in, like its date.
    start: startedAt && timezone ? formatTime(startedAt, timezone) : null,
    end: endedAt && timezone ? formatTime(endedAt, timezone) : null,
    duration_min: Math.round((entry.durationSec ?? 0) / 60),
    note: entry.note,
    client: client?.name ?? null
  }
}

/** Entries matching the filter in a format-independent shape; a running timer is left out. */
export function listExportRows(filter: TimeFilter): ExportRow[] {
  return selectTimeEntryDetails(and(conditions(filter), isNotNull(timeEntries.durationSec))).map(
    toExportRow
  )
}

/** RFC 4180: comma, quoted fields where needed, CRLF line endings, no BOM. */
export function toCsv(rows: readonly ExportRow[]): string {
  return stringify(
    rows.map((row) => ({ ...row, tags: row.tags.join(', ') })),
    {
      header: true,
      columns: [...exportColumns],
      record_delimiter: 'windows'
    }
  )
}

/** An array of entries with the CSV column names as keys, in the same order; no BOM. */
export function toJson(rows: readonly ExportRow[]): string {
  const entries = rows.map((row) =>
    Object.fromEntries(exportColumns.map((column) => [column, row[column]]))
  )
  return `${JSON.stringify(entries, null, 2)}
`
}

const writers: Record<
  ExportFormat,
  { readonly name: string; readonly write: (rows: readonly ExportRow[]) => string }
> = {
  csv: { name: 'CSV', write: toCsv },
  json: { name: 'JSON', write: toJson }
}

export function previewExport(filter: TimeFilter): ExportPreview {
  const rows = listExportRows(filter)
  return {
    rows: rows.slice(0, PREVIEW_ROWS),
    count: rows.length,
    totalMin: rows.reduce((sum, row) => sum + row.duration_min, 0)
  }
}

function defaultFileName({ from, to }: TimeFilter, format: ExportFormat): string {
  return from && to ? `taktra_${from}_${to}.${format}` : `taktra.${format}`
}

async function exportFile(
  window: BrowserWindow | null,
  filter: TimeFilter,
  format: ExportFormat
): Promise<string | null> {
  const writer = writers[format]
  const options = {
    defaultPath: join(app.getPath('downloads'), defaultFileName(filter, format)),
    filters: [{ name: writer.name, extensions: [format] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null

  const content = writer.write(listExportRows(filter))
  try {
    await writeFile(result.filePath, content, 'utf8')
  } catch (error) {
    throw new AppError('EXPORT_WRITE_FAILED', String(error))
  }
  return result.filePath
}

export function initExport(): void {
  handle('export:preview', z.tuple([timeFilter]), (_, filter) => previewExport(filter))
  handle('export:file', z.tuple([timeFilter, exportFormat]), (event, filter, format) =>
    exportFile(BrowserWindow.fromWebContents(event.sender), filter, format)
  )
}
