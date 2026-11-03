import type {
  CustomFieldScope,
  CustomFieldType,
  CustomFieldWithOptions,
  FieldValue
} from '../../../shared/model/customFields'
import { timestamp, type Timestamp } from './common'

export interface CustomFieldOptionV1 {
  readonly id: number
  readonly name: string
  readonly archivedAt: Timestamp | null
}

export interface CustomFieldV1 {
  readonly id: number
  readonly scope: CustomFieldScope
  readonly type: CustomFieldType
  readonly name: string
  readonly archivedAt: Timestamp | null
  /** Empty for text fields. Archived options are included, as stored values may refer to them. */
  readonly options: readonly CustomFieldOptionV1[]
}

export function toCustomField(field: CustomFieldWithOptions): CustomFieldV1 {
  return {
    id: field.id,
    scope: field.scope,
    type: field.type,
    name: field.name,
    archivedAt: timestamp(field.archivedAt),
    options: field.options.map((option) => ({
      id: option.id,
      name: option.name,
      archivedAt: timestamp(option.archivedAt)
    }))
  }
}

export interface CustomFieldValueV1 {
  readonly fieldId: number
  readonly name: string
  /** The text, or for select fields the name of the chosen option. */
  readonly value: string
  readonly optionId: number | null
}

/** The values set on one owner, in the order of the fields; fields without a value are left out. */
export function toCustomFieldValues(
  values: readonly FieldValue[],
  fields: readonly CustomFieldWithOptions[]
): CustomFieldValueV1[] {
  return fields.flatMap((field) => {
    const value = values.find((candidate) => candidate.fieldId === field.id)
    if (!value) return []
    const option = field.options.find((candidate) => candidate.id === value.optionId)
    const text = value.textValue ?? option?.name
    if (!text) return []
    return [{ fieldId: field.id, name: field.name, value: text, optionId: value.optionId }]
  })
}
