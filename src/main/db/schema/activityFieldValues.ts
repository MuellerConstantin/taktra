import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { fieldValueColumns, fieldValueConstraints } from './fieldValues'
import { activities } from './activities'

export const activityFieldValues = sqliteTable(
  'activity_field_values',
  {
    activityId: integer()
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    ...fieldValueColumns
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.fieldId] }),
    ...fieldValueConstraints('activity_field_values', table)
  ]
)
