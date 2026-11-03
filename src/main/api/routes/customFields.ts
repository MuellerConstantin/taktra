import type { Hono } from 'hono'
import { z } from 'zod'
import type { CustomFieldScope } from '../../../shared/model/customFields'
import { AppError } from '../../../shared/model/errors'
import {
  customFieldInput,
  customFieldListOptions,
  fieldValueInput,
  id,
  name
} from '../../../shared/validation'
import { customFields } from '../../core'
import {
  toCustomField,
  toCustomFieldOption,
  toCustomFieldValues,
  type CustomFieldV1,
  type CustomFieldValueV1
} from '../dto/customFields'
import { registerArchiveRoutes } from './archive'
import { idParam, parse, readBody, toBoolean } from '../parse'

/** The field values of every owner in a scope, loaded at once for a list. */
export function fieldValuesOf(scope: CustomFieldScope): (ownerId: number) => CustomFieldValueV1[] {
  const fields = customFields.list({ scope, includeArchived: true })
  const values = customFields.listValues(scope)
  return (ownerId) => toCustomFieldValues(values.get(ownerId) ?? [], fields)
}

const nameInput = z.object({ name }).strict()

/** A field with its options, the shape it has in the list. */
function presentField(fieldId: number): CustomFieldV1 {
  const field = customFields
    .list({ includeArchived: true })
    .find((candidate) => candidate.id === fieldId)
  if (!field) throw new AppError('CUSTOM_FIELD_NOT_FOUND', String(fieldId))
  return toCustomField(field)
}

/**
 * A value is set as `value` for a text field and as `optionId` for a select field, the names of
 * the response; `null` or leaving both out clears it. Fields not listed keep their value.
 */
const valueInput = z.array(
  z
    .object({
      fieldId: id,
      value: z.string().nullable().optional(),
      optionId: id.nullable().optional()
    })
    .strict()
)

/** `PATCH <path>/:id/custom-fields`, which sets field values on one owner of the scope. */
export function registerFieldValueRoutes(v1: Hono, path: string, scope: CustomFieldScope): void {
  v1.patch(`${path}/:id/custom-fields`, async (c) => {
    const ownerId = idParam(c)
    const values = parse(valueInput, await readBody(c)).map((value) => ({
      fieldId: value.fieldId,
      textValue: value.value ?? null,
      optionId: value.optionId ?? null
    }))
    customFields.setValues(scope, ownerId, parse(z.array(fieldValueInput), values))
    return c.json(fieldValuesOf(scope)(ownerId))
  })
}

export function registerCustomFieldRoutes(v1: Hono): void {
  v1.get('/custom-fields', (c) => {
    const options = parse(customFieldListOptions, {
      scope: c.req.query('scope'),
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    return c.json(customFields.list(options).map(toCustomField))
  })
  v1.get('/custom-fields/:id', (c) => c.json(presentField(idParam(c))))
  v1.post('/custom-fields', async (c) => {
    const field = customFields.create(parse(customFieldInput, await readBody(c)))
    return c.json(presentField(field.id), 201)
  })
  // Scope and type are fixed once a field exists; only its name changes.
  v1.patch('/custom-fields/:id', async (c) => {
    const field = customFields.rename(idParam(c), parse(nameInput, await readBody(c)).name)
    return c.json(presentField(field.id))
  })
  v1.delete('/custom-fields/:id', (c) => {
    customFields.delete(idParam(c))
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, '/custom-fields', customFields.setArchived, (field) =>
    presentField(field.id)
  )

  v1.post('/custom-fields/:id/options', async (c) => {
    const option = customFields.createOption(idParam(c), parse(nameInput, await readBody(c)).name)
    return c.json(toCustomFieldOption(option), 201)
  })
  v1.patch('/custom-field-options/:id', async (c) =>
    c.json(
      toCustomFieldOption(
        customFields.renameOption(idParam(c), parse(nameInput, await readBody(c)).name)
      )
    )
  )
  v1.delete('/custom-field-options/:id', (c) => {
    customFields.deleteOption(idParam(c))
    return c.body(null, 204)
  })
  registerArchiveRoutes(
    v1,
    '/custom-field-options',
    customFields.setOptionArchived,
    toCustomFieldOption
  )
}
