import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { MAX_NAME_LENGTH } from '../../../shared/validation/limits'

export const tags = sqliteTable(
  'tags',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    name: text().notNull(),
    color: text(),
    createdAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
  },
  (table) => [
    uniqueIndex('tags_name_unique').on(sql`lower(${table.name})`),
    check('tags_name_length', sql`length(${table.name}) <= ${sql.raw(String(MAX_NAME_LENGTH))}`)
  ]
)
