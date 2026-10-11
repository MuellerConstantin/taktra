import { z } from 'zod'
import { customFieldScopes, customFieldTypes } from '../customFields'
import { emptyToNull, id, name } from './common'
import { MAX_FIELD_VALUE_LENGTH } from './limits'

export const customFieldScope = z.enum(customFieldScopes)

export const customFieldInput = z.object({
  scope: customFieldScope,
  type: z.enum(customFieldTypes),
  name
})

export const customFieldListOptions = z
  .object({ scope: customFieldScope.optional(), includeArchived: z.boolean().optional() })
  .optional()

export const fieldValueInput = z
  .object({
    fieldId: id,
    textValue: z.string().trim().max(MAX_FIELD_VALUE_LENGTH).transform(emptyToNull).nullable(),
    optionId: id.nullable()
  })
  .refine(
    ({ textValue, optionId }) => textValue === null || optionId === null,
    'A value is either text or an option'
  )
