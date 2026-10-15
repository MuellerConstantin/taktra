import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { AppError } from '../../shared/errors'
import type { ExportColumn, ExportTemplate, ExportTemplateData } from '../../shared/export'
import { toNameKey } from '../../shared/names'
import { exportTemplateInput, id } from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import { exportTemplateColumns, exportTemplates } from '../db/schema'
import { handle } from '../ipc'
import { resolveHeaders } from './export'
import { sortByName } from './names'

type ColumnRow = typeof exportTemplateColumns.$inferSelect

function toColumn({ builtin, fieldId, header }: ColumnRow): ExportColumn {
  return builtin === null ? { fieldId: fieldId!, header } : { builtin, header }
}

function selectColumns(templateId?: number): ColumnRow[] {
  return getActiveDatabase()
    .select()
    .from(exportTemplateColumns)
    .where(templateId === undefined ? undefined : eq(exportTemplateColumns.templateId, templateId))
    .orderBy(asc(exportTemplateColumns.position))
    .all()
}

export function listExportTemplates(): ExportTemplate[] {
  const columns = selectColumns()
  return sortByName(getActiveDatabase().select().from(exportTemplates).all()).map((template) => ({
    ...template,
    columns: columns.filter((column) => column.templateId === template.id).map(toColumn)
  }))
}

export function getExportTemplate(id: number): ExportTemplate {
  const template = getActiveDatabase()
    .select()
    .from(exportTemplates)
    .where(eq(exportTemplates.id, id))
    .get()
  if (!template) throw new AppError('EXPORT_TEMPLATE_NOT_FOUND', String(id))
  return { ...template, columns: selectColumns(id).map(toColumn) }
}

function insertColumns(templateId: number, columns: readonly ExportColumn[]): void {
  getActiveDatabase()
    .insert(exportTemplateColumns)
    .values(
      columns.map((column, position) => ({
        templateId,
        position,
        builtin: 'builtin' in column ? column.builtin : null,
        fieldId: 'fieldId' in column ? column.fieldId : null,
        header: column.header ?? null
      }))
    )
    .run()
}

/** Saved templates can always be exported, so conflicting headers are rejected here already. */
function save(input: ExportTemplateData, write: () => number): ExportTemplate {
  resolveHeaders(input.columns)

  const db = getActiveDatabase()
  try {
    return getExportTemplate(
      db.transaction(() => {
        const templateId = write()
        db.delete(exportTemplateColumns)
          .where(eq(exportTemplateColumns.templateId, templateId))
          .run()
        insertColumns(templateId, input.columns)
        return templateId
      })
    )
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('EXPORT_TEMPLATE_NAME_TAKEN', String(error))
    throw error
  }
}

export function createExportTemplate(input: ExportTemplateData): ExportTemplate {
  const { name, format, layout } = input
  return save(
    input,
    () =>
      getActiveDatabase()
        .insert(exportTemplates)
        .values({ name, nameKey: toNameKey(name), format, layout })
        .returning({ id: exportTemplates.id })
        .get().id
  )
}

export function updateExportTemplate(id: number, input: ExportTemplateData): ExportTemplate {
  getExportTemplate(id)
  const { name, format, layout } = input
  return save(input, () => {
    getActiveDatabase()
      .update(exportTemplates)
      .set({ name, nameKey: toNameKey(name), format, layout })
      .where(eq(exportTemplates.id, id))
      .run()
    return id
  })
}

export function deleteExportTemplate(id: number): void {
  getExportTemplate(id)
  getActiveDatabase().delete(exportTemplates).where(eq(exportTemplates.id, id)).run()
}

export function initExportTemplates(): void {
  handle('exportTemplates:list', z.tuple([]), () => listExportTemplates())
  handle('exportTemplates:get', z.tuple([id]), (_, templateId) => getExportTemplate(templateId))
  handle('exportTemplates:create', z.tuple([exportTemplateInput]), (_, input) =>
    createExportTemplate(input)
  )
  handle('exportTemplates:update', z.tuple([id, exportTemplateInput]), (_, templateId, input) =>
    updateExportTemplate(templateId, input)
  )
  handle('exportTemplates:delete', z.tuple([id]), (_, templateId) =>
    deleteExportTemplate(templateId)
  )
}
