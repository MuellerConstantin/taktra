import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import type { Client } from '../../../../shared/model/clients'
import { clientInput } from '../../../../shared/validation'
import { clients } from '../../../core'
import { ClientV1, toClient } from '../dto/clients'
import { json, jsonBody, noContent } from '../../openapi'
import { errors } from '../errors'
import { booleanQuery, idParams } from '../params'
import { registerArchiveRoutes } from './archive'
import { fieldValuesOf, registerFieldValueRoutes } from './customFields'

const tags = ['Clients']

function present(client: Client): ClientV1 {
  return toClient(client, fieldValuesOf('client')(client.id))
}

const list = createRoute({
  method: 'get',
  path: '/clients',
  tags,
  summary: 'List clients',
  request: { query: z.object({ includeArchived: booleanQuery }) },
  responses: { 200: json(z.array(ClientV1), 'The clients, sorted by name'), ...errors(400) }
})

const get = createRoute({
  method: 'get',
  path: '/clients/{id}',
  tags,
  summary: 'Get a client',
  request: { params: idParams },
  responses: { 200: json(ClientV1, 'The client'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/clients',
  tags,
  summary: 'Create a client',
  request: { body: jsonBody(clientInput) },
  responses: { 201: json(ClientV1, 'The new client'), ...errors(400, 409) }
})

const update = createRoute({
  method: 'patch',
  path: '/clients/{id}',
  tags,
  summary: 'Change a client',
  request: { params: idParams, body: jsonBody(clientInput.partial()) },
  responses: { 200: json(ClientV1, 'The changed client'), ...errors(400, 404, 409) }
})

const remove = createRoute({
  method: 'delete',
  path: '/clients/{id}',
  tags,
  summary: 'Delete a client',
  description: 'Only possible without booked time; otherwise archive it.',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404, 409) }
})

export function registerClientRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => {
    const valuesOf = fieldValuesOf('client')
    const found = clients.list(c.req.valid('query'))
    return c.json(
      found.map((client) => toClient(client, valuesOf(client.id))),
      200
    )
  })
  v1.openapi(get, (c) => c.json(present(clients.get(c.req.valid('param').id)), 200))
  v1.openapi(create, (c) => c.json(present(clients.create(c.req.valid('json'))), 201))
  v1.openapi(update, (c) =>
    c.json(present(clients.update(c.req.valid('param').id, c.req.valid('json'))), 200)
  )
  v1.openapi(remove, (c) => {
    clients.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, {
    path: '/clients',
    tags,
    noun: 'client',
    schema: ClientV1,
    setArchived: clients.setArchived,
    present
  })
  registerFieldValueRoutes(v1, { path: '/clients', tags, noun: 'client', scope: 'client' })
}
