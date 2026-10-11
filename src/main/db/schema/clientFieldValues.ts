import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { fieldValueColumns, fieldValueConstraints } from './fieldValues'
import { clients } from './clients'

export const clientFieldValues = sqliteTable(
  'client_field_values',
  {
    clientId: integer()
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    ...fieldValueColumns
  },
  (table) => [
    primaryKey({ columns: [table.clientId, table.fieldId] }),
    ...fieldValueConstraints('client_field_values', table)
  ]
)
