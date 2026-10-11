import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { fieldValueColumns, fieldValueConstraints } from './fieldValues'
import { projects } from './projects'

export const projectFieldValues = sqliteTable(
  'project_field_values',
  {
    projectId: integer()
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    ...fieldValueColumns
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.fieldId] }),
    ...fieldValueConstraints('project_field_values', table)
  ]
)
