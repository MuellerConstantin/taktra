import type { Hono } from 'hono'
import { listOptions } from '../../../shared/validation'
import { clients } from '../../core'
import { toClient } from '../dto/clients'
import { idParam, parse, toBoolean } from '../parse'

export function registerClientRoutes(v1: Hono): void {
  v1.get('/clients', (c) => {
    const options = parse(listOptions, {
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    return c.json(clients.list(options).map(toClient))
  })
  v1.get('/clients/:id', (c) => c.json(toClient(clients.get(idParam(c)))))
}
