import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '../../../shared/validation/limits'

export const projects = sqliteTable(
  'projects',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    name: text().notNull(),
    nameKey: text().notNull(),
    description: text(),
    color: text(),
    archivedAt: integer({ mode: 'timestamp_ms' }),
    createdAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
  },
  (table) => [
    uniqueIndex('projects_name_unique').on(table.nameKey),
    check(
      'projects_name_length',
      sql`length(${table.name}) <= ${sql.raw(String(MAX_NAME_LENGTH))}`
    ),
    check(
      'projects_description_length',
      sql`length(${table.description}) <= ${sql.raw(String(MAX_DESCRIPTION_LENGTH))}`
    )
  ]
)
