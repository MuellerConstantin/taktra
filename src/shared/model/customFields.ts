import type { z } from 'zod'
import type { customFieldInput, fieldValueInput } from '../validation/customFields'

export const customFieldScopes = ['project', 'client', 'activity'] as const

export type CustomFieldScope = (typeof customFieldScopes)[number]

export const customFieldTypes = ['text', 'select'] as const

export type CustomFieldType = (typeof customFieldTypes)[number]

export interface CustomField {
  readonly id: number
  readonly scope: CustomFieldScope
  readonly type: CustomFieldType
  readonly name: string
  /** Names the field's export column. */
  readonly nameKey: string
  readonly archivedAt: Date | null
}

export interface CustomFieldOption {
  readonly id: number
  readonly fieldId: number
  readonly name: string
  readonly archivedAt: Date | null
}

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
