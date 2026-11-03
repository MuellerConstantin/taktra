import type { Hono } from 'hono'
import type { Client } from '../../../shared/model/clients'
import { clientInput, listOptions } from '../../../shared/validation'
import { clients } from '../../core'
import { toClient } from '../dto/clients'
import { idParam, parse, readBody, toBoolean } from '../parse'
import { registerArchiveRoutes } from './archive'
import { fieldValuesOf, registerFieldValueRoutes } from './customFields'

function present(client: Client): ReturnType<typeof toClient> {
  return toClient(client, fieldValuesOf('client')(client.id))
}

export function registerClientRoutes(v1: Hono): void {
  v1.get('/clients', (c) => {
    const options = parse(listOptions, {
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    const valuesOf = fieldValuesOf('client')
    return c.json(clients.list(options).map((client) => toClient(client, valuesOf(client.id))))
  })
  v1.get('/clients/:id', (c) => c.json(present(clients.get(idParam(c)))))
  v1.post('/clients', async (c) =>
    c.json(present(clients.create(parse(clientInput, await readBody(c)))), 201)
  )
  v1.patch('/clients/:id', async (c) =>
    c.json(present(clients.update(idParam(c), parse(clientInput.partial(), await readBody(c)))))
  )
  v1.delete('/clients/:id', (c) => {
    clients.delete(idParam(c))
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, '/clients', clients.setArchived, present)
  registerFieldValueRoutes(v1, '/clients', 'client')
}
