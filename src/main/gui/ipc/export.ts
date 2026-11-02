import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, dialog } from 'electron'
import { z } from 'zod'
import { AppError } from '../../../shared/errors'
import type { ExportColumn, ExportFormat, ExportLayout } from '../../../shared/export'
import type { TimeFilter } from '../../../shared/reports'
import { exportColumns, exportFormat, exportLayout, timeFilter } from '../../../shared/validation'
import { buildExportFile, previewExport } from '../../core/domain/export'
import { handle } from './handle'

async function saveExportFile(
  window: BrowserWindow | null,
  filter: TimeFilter,
  format: ExportFormat,
  columns?: readonly ExportColumn[],
  layout?: ExportLayout
): Promise<string | null> {
  // Built before the dialog, so a column conflict is reported before a file is chosen.
  const file = await buildExportFile(filter, format, columns, layout)
  const options = {
    defaultPath: join(app.getPath('downloads'), file.fileName),
    filters: [{ name: file.formatName, extensions: [format] }]
  }
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null

  try {
    await writeFile(result.filePath, file.content, 'utf8')
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
      saveExportFile(BrowserWindow.fromWebContents(event.sender), filter, format, columns, layout)
  )
}
