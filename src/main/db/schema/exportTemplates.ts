import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { exportFormats } from '../../../shared/export'
import { MAX_NAME_LENGTH } from '../../../shared/validation/limits'

export const exportTemplates = sqliteTable(
  'export_templates',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    name: text().notNull(),
    nameKey: text().notNull(),
    format: text({ enum: exportFormats }).notNull(),
    createdAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
  },
  (table) => [
    uniqueIndex('export_templates_name_unique').on(table.nameKey),
    check(
      'export_templates_name_length',
      sql`length(${table.name}) <= ${sql.raw(String(MAX_NAME_LENGTH))}`
    ),
    check(
      'export_templates_format',
      sql`${table.format} IN (${sql.raw(exportFormats.map((format) => `'${format}'`).join(', '))})`
    )
  ]
)
