import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import type { CustomFieldScope } from '../../../../shared/model/customFields'
import { AppError } from '../../../../shared/model/errors'
import { customFieldInput, customFieldScope, fieldValueInput } from '../../../../shared/validation'
import { customFields } from '../../../core'
import { NameInputV1 } from '../dto/common'
import {
  CustomFieldOptionV1,
  CustomFieldV1,
  CustomFieldValueInputV1,
  CustomFieldValueV1,
  toCustomField,
  toCustomFieldOption,
  toCustomFieldValues
} from '../dto/customFields'
import { json, jsonBody, noContent } from '../../openapi'
import { errors } from '../errors'
import { booleanQuery, idParams } from '../params'
import { parse } from '../../parse'
import { registerArchiveRoutes } from './archive'

const tags = ['Custom fields']

/** The field values of every owner in a scope, loaded at once for a list. */
export function fieldValuesOf(scope: CustomFieldScope): (ownerId: number) => CustomFieldValueV1[] {
  const fields = customFields.list({ scope, includeArchived: true })
  const values = customFields.listValues(scope)
  return (ownerId) => toCustomFieldValues(values.get(ownerId) ?? [], fields)
}

/** A field with its options, the shape it has in the list. */
function presentField(fieldId: number): CustomFieldV1 {
  const field = customFields
    .list({ includeArchived: true })
    .find((candidate) => candidate.id === fieldId)
  if (!field) throw new AppError('CUSTOM_FIELD_NOT_FOUND', String(fieldId))
  return toCustomField(field)
}

interface FieldOwner {
  readonly path: string
  readonly tags: string[]
  readonly noun: string
  readonly scope: CustomFieldScope
}

/** `PATCH <path>/{id}/custom-fields`, which sets field values on one owner of the scope. */
export function registerFieldValueRoutes(
  v1: OpenAPIHono,
  { path, tags: ownerTags, noun, scope }: FieldOwner
): void {
  const route = createRoute({
    method: 'patch',
    path: `${path}/{id}/custom-fields`,
    tags: ownerTags,
    summary: `Set custom field values of a ${noun}`,
    request: { params: idParams, body: jsonBody(CustomFieldValueInputV1) },
    responses: {
      200: json(z.array(CustomFieldValueV1), `All values of the ${noun}`),
      ...errors(400, 404)
    }
  })
  v1.openapi(route, (c) => {
    const ownerId = c.req.valid('param').id
    const values = c.req.valid('json').map((value) => ({
      fieldId: value.fieldId,
      textValue: value.value ?? null,
      optionId: value.optionId ?? null
    }))
    customFields.setValues(scope, ownerId, parse(z.array(fieldValueInput), values))
    return c.json(fieldValuesOf(scope)(ownerId), 200)
  })
}

const list = createRoute({
  method: 'get',
  path: '/custom-fields',
  tags,
  summary: 'List custom fields',
  request: {
    query: z.object({ scope: customFieldScope.optional(), includeArchived: booleanQuery })
  },
  responses: {
    200: json(z.array(CustomFieldV1), 'The fields with their options, sorted by name'),
    ...errors(400)
  }
})

const get = createRoute({
  method: 'get',
  path: '/custom-fields/{id}',
  tags,
  summary: 'Get a custom field',
  request: { params: idParams },
  responses: { 200: json(CustomFieldV1, 'The field with its options'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/custom-fields',
  tags,
  summary: 'Create a custom field',
  description: 'Scope and type are fixed once the field exists.',
  request: { body: jsonBody(customFieldInput) },
  responses: { 201: json(CustomFieldV1, 'The new field'), ...errors(400, 409) }
})

const rename = createRoute({
  method: 'patch',
  path: '/custom-fields/{id}',
  tags,
  summary: 'Rename a custom field',
  request: { params: idParams, body: jsonBody(NameInputV1) },
  responses: { 200: json(CustomFieldV1, 'The renamed field'), ...errors(400, 404, 409) }
})

const remove = createRoute({
  method: 'delete',
  path: '/custom-fields/{id}',
  tags,
  summary: 'Delete a custom field',
  description: 'Only possible while no owner has a value; otherwise archive it.',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404, 409) }
})

const createOption = createRoute({
  method: 'post',
  path: '/custom-fields/{id}/options',
  tags,
  summary: 'Add an option to a select field',
  request: { params: idParams, body: jsonBody(NameInputV1) },
  responses: { 201: json(CustomFieldOptionV1, 'The new option'), ...errors(400, 404, 409) }
})

const renameOption = createRoute({
  method: 'patch',
  path: '/custom-field-options/{id}',
  tags,
  summary: 'Rename an option',
  request: { params: idParams, body: jsonBody(NameInputV1) },
  responses: { 200: json(CustomFieldOptionV1, 'The renamed option'), ...errors(400, 404, 409) }
})

const removeOption = createRoute({
  method: 'delete',
  path: '/custom-field-options/{id}',
  tags,
  summary: 'Delete an option',
  description: 'Only possible while no owner has chosen it; otherwise archive it.',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404, 409) }
})

export function registerCustomFieldRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => c.json(customFields.list(c.req.valid('query')).map(toCustomField), 200))
  v1.openapi(get, (c) => c.json(presentField(c.req.valid('param').id), 200))
  v1.openapi(create, (c) => {
    const field = customFields.create(c.req.valid('json'))
    return c.json(presentField(field.id), 201)
  })
  v1.openapi(rename, (c) => {
    const field = customFields.rename(c.req.valid('param').id, c.req.valid('json').name)
    return c.json(presentField(field.id), 200)
  })
  v1.openapi(remove, (c) => {
    customFields.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, {
    path: '/custom-fields',
    tags,
    noun: 'custom field',
    schema: CustomFieldV1,
    setArchived: customFields.setArchived,
    present: (field) => presentField(field.id)
  })

  v1.openapi(createOption, (c) => {
    const option = customFields.createOption(c.req.valid('param').id, c.req.valid('json').name)
    return c.json(toCustomFieldOption(option), 201)
  })
  v1.openapi(renameOption, (c) => {
    const option = customFields.renameOption(c.req.valid('param').id, c.req.valid('json').name)
    return c.json(toCustomFieldOption(option), 200)
  })
  v1.openapi(removeOption, (c) => {
    customFields.deleteOption(c.req.valid('param').id)
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, {
    path: '/custom-field-options',
    tags,
    noun: 'option',
    schema: CustomFieldOptionV1,
    setArchived: customFields.setOptionArchived,
    present: toCustomFieldOption
  })
}
