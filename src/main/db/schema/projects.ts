import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable(
  'projects',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    name: text().notNull(),
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
  (table) => [uniqueIndex('projects_name_unique').on(sql`lower(${table.name})`)]
)
