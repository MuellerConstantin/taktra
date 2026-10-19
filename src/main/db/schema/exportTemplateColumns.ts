import { sql } from 'drizzle-orm'
import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { builtinExportColumns, exportAggregations } from '../../../shared/export'
import { MAX_NAME_LENGTH } from '../../../shared/validation/limits'
import { customFields } from './customFields'
import { exportTemplates } from './exportTemplates'

export const exportTemplateColumns = sqliteTable(
  'export_template_columns',
  {
    templateId: integer()
      .notNull()
      .references(() => exportTemplates.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    builtin: text({ enum: builtinExportColumns }),
    fieldId: integer().references(() => customFields.id, { onDelete: 'cascade' }),
    header: text(),
    aggregation: text({ enum: exportAggregations })
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.position] }),
    index('export_template_columns_field_idx').on(table.fieldId),
    check(
      'export_template_columns_one_source',
      sql`(${table.builtin} IS NULL) <> (${table.fieldId} IS NULL)`
    ),
    check(
      'export_template_columns_builtin',
      sql`${table.builtin} IN (${sql.raw(builtinExportColumns.map((column) => `'${column}'`).join(', '))})`
    ),
    check(
      'export_template_columns_aggregation',
      sql`${table.aggregation} IN (${sql.raw(exportAggregations.map((aggregation) => `'${aggregation}'`).join(', '))})`
    ),
    check(
      'export_template_columns_header_length',
      sql`length(${table.header}) <= ${sql.raw(String(MAX_NAME_LENGTH))}`
    )
  ]
)
