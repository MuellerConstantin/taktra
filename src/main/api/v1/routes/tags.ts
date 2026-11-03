import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { tagInput } from '../../../../shared/validation'
import { tags as tagService } from '../../../core'
import { TagV1, toTag } from '../dto/tags'
import { json, jsonBody, noContent } from '../../openapi'
import { errors } from '../errors'
import { idParams } from '../params'

const tags = ['Tags']

const list = createRoute({
  method: 'get',
  path: '/tags',
  tags,
  summary: 'List tags',
  responses: { 200: json(z.array(TagV1), 'The tags, sorted by name'), ...errors() }
})

const get = createRoute({
  method: 'get',
  path: '/tags/{id}',
  tags,
  summary: 'Get a tag',
  request: { params: idParams },
  responses: { 200: json(TagV1, 'The tag'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/tags',
  tags,
  summary: 'Create a tag',
  request: { body: jsonBody(tagInput) },
  responses: { 201: json(TagV1, 'The new tag'), ...errors(400, 409) }
})

const update = createRoute({
  method: 'patch',
  path: '/tags/{id}',
  tags,
  summary: 'Change a tag',
  request: { params: idParams, body: jsonBody(tagInput.partial()) },
  responses: { 200: json(TagV1, 'The changed tag'), ...errors(400, 404, 409) }
})

const remove = createRoute({
  method: 'delete',
  path: '/tags/{id}',
  tags,
  summary: 'Delete a tag',
  description: 'Removes the tag from all activities and thus from their booked time.',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404) }
})

export function registerTagRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => c.json(tagService.list().map(toTag), 200))
  v1.openapi(get, (c) => c.json(toTag(tagService.get(c.req.valid('param').id)), 200))
  v1.openapi(create, (c) => c.json(toTag(tagService.create(c.req.valid('json'))), 201))
  v1.openapi(update, (c) =>
    c.json(toTag(tagService.update(c.req.valid('param').id, c.req.valid('json'))), 200)
  )
  v1.openapi(remove, (c) => {
    tagService.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
}
