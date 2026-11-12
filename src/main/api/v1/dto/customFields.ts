import { z } from '@hono/zod-openapi'
import {
  customFieldScopes,
  customFieldTypes,
  type CustomFieldOption,
  type CustomFieldWithOptions,
  type FieldValue
} from '@/shared/model/customFields'
import { id } from '@/shared/validation'
import { timestamp, TimestampV1 } from './common'

export const CustomFieldOptionV1 = z
  .object({ id: z.number().int(), name: z.string(), archivedAt: TimestampV1.nullable() })
  .openapi('CustomFieldOption')

export type CustomFieldOptionV1 = z.infer<typeof CustomFieldOptionV1>

export const CustomFieldV1 = z
  .object({
    id: z.number().int(),
    scope: z.enum(customFieldScopes),
    type: z.enum(customFieldTypes),
    name: z.string(),
    archivedAt: TimestampV1.nullable(),
    options: z.array(CustomFieldOptionV1).openapi({
      description:
        'Empty for text fields. Archived options are included, as stored values may refer to them.'
    })
  })
  .openapi('CustomField')

export type CustomFieldV1 = z.infer<typeof CustomFieldV1>

export const CustomFieldValueV1 = z
  .object({
    fieldId: z.number().int(),
    name: z.string(),
    value: z
      .string()
      .openapi({ description: 'The text, or for select fields the name of the chosen option.' }),
    optionId: z.number().int().nullable()
  })
  .openapi('CustomFieldValue')

export type CustomFieldValueV1 = z.infer<typeof CustomFieldValueV1>

export function toCustomFieldOption(option: CustomFieldOption): CustomFieldOptionV1 {
  return { id: option.id, name: option.name, archivedAt: timestamp(option.archivedAt) }
}

export function toCustomField(field: CustomFieldWithOptions): CustomFieldV1 {
  return {
    id: field.id,
    scope: field.scope,
    type: field.type,
    name: field.name,
    archivedAt: timestamp(field.archivedAt),
    options: field.options.map(toCustomFieldOption)
  }
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

export const CustomFieldValueInputV1 = z
  .array(
    z
      .object({
        fieldId: id,
        value: z.string().nullable().optional().openapi({ description: 'For a text field.' }),
        optionId: id.nullable().optional().openapi({ description: 'For a select field.' })
      })
      .strict()
  )
  .openapi('CustomFieldValueInput', {
    description:
      'Sets the listed fields; null or leaving both value and optionId out clears one. Fields not listed keep their value.'
  })
