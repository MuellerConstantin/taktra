import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stringify } from 'csv-stringify/sync'
import { and, isNotNull } from 'drizzle-orm'
import { app, BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import { AppError } from '../../shared/errors'
import { exportColumns, type ExportPreview, type ExportRow } from '../../shared/export'
import type { TimeFilter } from '../../shared/reports'
import type { TimeEntryDetails } from '../../shared/timeEntries'
import { timeFilter } from '../../shared/validation'
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
    tags: tags.map((tag) => tag.name).join(', '),
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
  return stringify([...rows], {
    header: true,
    columns: [...exportColumns],
    record_delimiter: 'windows'
  })
}

export function previewExport(filter: TimeFilter): ExportPreview {
  const rows = listExportRows(filter)
  return {
    rows: rows.slice(0, PREVIEW_ROWS),
    count: rows.length,
    totalMin: rows.reduce((sum, row) => sum + Number(row.duration_min), 0)
  }
}

function defaultFileName({ from, to }: TimeFilter): string {
  return from && to ? `taktra_${from}_${to}.csv` : 'taktra.csv'
}

async function exportCsv(window: BrowserWindow | null, filter: TimeFilter): Promise<string | null> {
  const options = {
    defaultPath: join(app.getPath('downloads'), defaultFileName(filter)),
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null

  const csv = toCsv(listExportRows(filter))
  try {
    await writeFile(result.filePath, csv, 'utf8')
  } catch (error) {
    throw new AppError('EXPORT_WRITE_FAILED', String(error))
  }
  return result.filePath
}

export function initExport(): void {
  handle('export:preview', z.tuple([timeFilter]), (_, filter) => previewExport(filter))
  handle('export:csv', z.tuple([timeFilter]), (event, filter) =>
    exportCsv(BrowserWindow.fromWebContents(event.sender), filter)
  )
}
