import { sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { activities } from './activities'

export const timeEntries = sqliteTable(
  'time_entries',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    activityId: integer()
      .notNull()
      .references(() => activities.id, { onDelete: 'restrict' }),
    date: text().notNull(),
    startedAt: integer({ mode: 'timestamp_ms' }),
    endedAt: integer({ mode: 'timestamp_ms' }),
    timezone: text(),
    durationSec: integer(),
    note: text(),
    createdAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
  },
  (table) => [
    index('time_entries_date_idx').on(table.date),
    index('time_entries_activity_idx').on(table.activityId),
    check(
      'time_entries_kind',
      sql`(${table.startedAt} IS NULL AND ${table.endedAt} IS NULL AND ${table.timezone} IS NULL AND ${table.durationSec} IS NOT NULL AND ${table.durationSec} > 0)
        OR (${table.startedAt} IS NOT NULL AND ${table.timezone} IS NOT NULL AND ${table.endedAt} IS NULL AND ${table.durationSec} IS NULL)
        OR (${table.startedAt} IS NOT NULL AND ${table.timezone} IS NOT NULL AND ${table.endedAt} IS NOT NULL AND ${table.endedAt} > ${table.startedAt} AND ${table.durationSec} IS NOT NULL AND ${table.durationSec} > 0)`
    )
  ]
)
