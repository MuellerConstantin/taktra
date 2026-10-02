import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { projects } from './projects'

export const activities = sqliteTable(
  'activities',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uid: text()
      .notNull()
      .unique()
      .$defaultFn(() => randomUUID()),
    projectId: integer()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text().notNull(),
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
    uniqueIndex('activities_project_name_unique').on(table.projectId, sql`lower(${table.name})`)
  ]
)
