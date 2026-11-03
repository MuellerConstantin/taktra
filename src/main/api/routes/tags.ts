import type { Hono } from 'hono'
import { tags } from '../../core'
import { toTag } from '../dto/tags'
import { idParam } from '../parse'

export function registerTagRoutes(v1: Hono): void {
  v1.get('/tags', (c) => c.json(tags.list().map(toTag)))
  v1.get('/tags/:id', (c) => c.json(toTag(tags.get(idParam(c)))))
}
