import type { Hono } from 'hono'
import { tagInput } from '../../../shared/validation'
import { tags } from '../../core'
import { toTag } from '../dto/tags'
import { idParam, parse, readBody } from '../parse'

export function registerTagRoutes(v1: Hono): void {
  v1.get('/tags', (c) => c.json(tags.list().map(toTag)))
  v1.get('/tags/:id', (c) => c.json(toTag(tags.get(idParam(c)))))
  v1.post('/tags', async (c) => c.json(toTag(tags.create(parse(tagInput, await readBody(c)))), 201))
  v1.patch('/tags/:id', async (c) =>
    c.json(toTag(tags.update(idParam(c), parse(tagInput.partial(), await readBody(c)))))
  )
  v1.delete('/tags/:id', (c) => {
    tags.delete(idParam(c))
    return c.body(null, 204)
  })
}
