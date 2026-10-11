import type { InferSelectModel } from 'drizzle-orm'
import type { customFieldOptions } from '../main/db/schema/customFieldOptions'
import type { customFields } from '../main/db/schema/customFields'

export const customFieldScopes = ['project', 'client', 'activity'] as const

export type CustomFieldScope = (typeof customFieldScopes)[number]

export const customFieldTypes = ['text', 'select'] as const

export type CustomFieldType = (typeof customFieldTypes)[number]

export type CustomField = InferSelectModel<typeof customFields>

export type CustomFieldOption = InferSelectModel<typeof customFieldOptions>
