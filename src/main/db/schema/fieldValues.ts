import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  text,
  type CheckBuilder,
  type IndexBuilder,
  type SQLiteColumn
} from 'drizzle-orm/sqlite-core'
import { MAX_FIELD_VALUE_LENGTH } from '../../../shared/validation/limits'
import { customFieldOptions } from './customFieldOptions'
import { customFields } from './customFields'

export const fieldValueColumns = {
  fieldId: integer()
    .notNull()
    .references(() => customFields.id, { onDelete: 'restrict' }),
  textValue: text(),
  optionId: integer().references(() => customFieldOptions.id, { onDelete: 'restrict' })
}

export function fieldValueConstraints(
  name: string,
  table: { fieldId: SQLiteColumn; textValue: SQLiteColumn; optionId: SQLiteColumn }
): [IndexBuilder, CheckBuilder, CheckBuilder] {
  return [
    index(`${name}_field_idx`).on(table.fieldId),
    check(`${name}_one_value`, sql`(${table.textValue} IS NULL) <> (${table.optionId} IS NULL)`),
    check(
      `${name}_text_length`,
      sql`length(${table.textValue}) <= ${sql.raw(String(MAX_FIELD_VALUE_LENGTH))}`
    )
  ]
}
