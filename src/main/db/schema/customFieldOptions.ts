import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { MAX_NAME_LENGTH } from '../../../shared/validation/limits'
import { customFields } from './customFields'

export const customFieldOptions = sqliteTable(
  'custom_field_options',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    fieldId: integer()
      .notNull()
      .references(() => customFields.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    nameKey: text().notNull(),
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
    uniqueIndex('custom_field_options_field_name_unique').on(table.fieldId, table.nameKey),
    check(
      'custom_field_options_name_length',
      sql`length(${table.name}) <= ${sql.raw(String(MAX_NAME_LENGTH))}`
    )
  ]
)
