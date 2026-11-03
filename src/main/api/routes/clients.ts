import type { Hono } from 'hono'
import { listOptions } from '../../../shared/validation'
import { clients } from '../../core'
import { toClient } from '../dto/clients'
import { idParam, parse, toBoolean } from '../parse'
import { fieldValuesOf } from './customFields'

export function registerClientRoutes(v1: Hono): void {
  v1.get('/clients', (c) => {
    const options = parse(listOptions, {
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    const valuesOf = fieldValuesOf('client')
    return c.json(clients.list(options).map((client) => toClient(client, valuesOf(client.id))))
  })
  v1.get('/clients/:id', (c) => {
    const client = clients.get(idParam(c))
    return c.json(toClient(client, fieldValuesOf('client')(client.id)))
  })
}
