import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { customFieldScopes, customFieldTypes } from '../../../shared/customFields'
import { MAX_NAME_LENGTH } from '../../../shared/validation/limits'

function oneOf(values: readonly string[]): string {
  return values.map((value) => `'${value}'`).join(', ')
}

export const customFields = sqliteTable(
  'custom_fields',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    scope: text({ enum: customFieldScopes }).notNull(),
    type: text({ enum: customFieldTypes }).notNull(),
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
    uniqueIndex('custom_fields_scope_name_unique').on(table.scope, table.nameKey),
    check(
      'custom_fields_name_length',
      sql`length(${table.name}) <= ${sql.raw(String(MAX_NAME_LENGTH))}`
    ),
    check('custom_fields_scope', sql`${table.scope} IN (${sql.raw(oneOf(customFieldScopes))})`),
    check('custom_fields_type', sql`${table.type} IN (${sql.raw(oneOf(customFieldTypes))})`)
  ]
)
