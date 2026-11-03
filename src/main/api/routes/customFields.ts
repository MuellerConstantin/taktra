import type { Hono } from 'hono'
import type { CustomFieldScope } from '../../../shared/model/customFields'
import { customFieldListOptions } from '../../../shared/validation'
import { customFields } from '../../core'
import { toCustomField, toCustomFieldValues, type CustomFieldValueV1 } from '../dto/customFields'
import { parse, toBoolean } from '../parse'

/** The field values of every owner in a scope, loaded at once for a list. */
export function fieldValuesOf(scope: CustomFieldScope): (ownerId: number) => CustomFieldValueV1[] {
  const fields = customFields.list({ scope, includeArchived: true })
  const values = customFields.listValues(scope)
  return (ownerId) => toCustomFieldValues(values.get(ownerId) ?? [], fields)
}

export function registerCustomFieldRoutes(v1: Hono): void {
  v1.get('/custom-fields', (c) => {
    const options = parse(customFieldListOptions, {
      scope: c.req.query('scope'),
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    return c.json(customFields.list(options).map(toCustomField))
  })
}
