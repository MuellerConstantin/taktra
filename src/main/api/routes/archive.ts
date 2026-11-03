import type { Hono } from 'hono'
import { idParam } from '../parse'

/** `POST <path>/:id/archive` and `/unarchive`, which every archivable resource has. */
export function registerArchiveRoutes<Archived>(
  v1: Hono,
  path: string,
  setArchived: (id: number, archived: boolean) => Archived,
  present: (archived: Archived) => unknown
): void {
  v1.post(`${path}/:id/archive`, (c) => c.json(present(setArchived(idParam(c), true))))
  v1.post(`${path}/:id/unarchive`, (c) => c.json(present(setArchived(idParam(c), false))))
}
