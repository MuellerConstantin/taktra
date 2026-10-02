import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const properties = sqliteTable('properties', {
  key: text().primaryKey(),
  value: text().notNull()
})
