import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { customFieldOptions } from '../main/db/schema/customFieldOptions'
import type { customFields } from '../main/db/schema/customFields'
import type { customFieldInput, fieldValueInput } from './validation/customFields'

export const customFieldScopes = ['project', 'client', 'activity'] as const

export type CustomFieldScope = (typeof customFieldScopes)[number]

export const customFieldTypes = ['text', 'select'] as const

export type CustomFieldType = (typeof customFieldTypes)[number]

export type CustomField = InferSelectModel<typeof customFields>

export type CustomFieldOption = InferSelectModel<typeof customFieldOptions>

/** Archived options are included, because stored values may still refer to them. */
export type CustomFieldWithOptions = CustomField & {
  readonly options: readonly CustomFieldOption[]
}

export type CustomFieldInput = z.input<typeof customFieldInput>

export interface FieldValue {
  readonly fieldId: number
  readonly textValue: string | null
  readonly optionId: number | null
}

export type FieldValueInput = z.input<typeof fieldValueInput>

export type FieldValueData = z.output<typeof fieldValueInput>
