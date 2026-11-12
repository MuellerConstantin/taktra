import { createRoute, type OpenAPIHono, type z } from '@hono/zod-openapi'
import { json } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { idParams } from '@/main/api/v1/params'

interface Archivable<Archived, Schema extends z.ZodType> {
  readonly path: string
  readonly tags: string[]
  readonly noun: string
  readonly schema: Schema
  readonly setArchived: (id: number, archived: boolean) => Archived
  readonly present: (archived: Archived) => z.infer<Schema>
}

/** `POST <path>/{id}/archive` and `/unarchive`, which every archivable resource has. */
export function registerArchiveRoutes<Archived, Schema extends z.ZodType>(
  v1: OpenAPIHono,
  { path, tags, noun, schema, setArchived, present }: Archivable<Archived, Schema>
): void {
  for (const archived of [true, false]) {
    const route = createRoute({
      method: 'post',
      path: `${path}/{id}/${archived ? 'archive' : 'unarchive'}`,
      tags,
      summary: `${archived ? 'Archive' : 'Restore'} a ${noun}`,
      request: { params: idParams },
      responses: { 200: json(schema, `The ${noun}`), ...errors(400, 404) }
    })
    v1.openapi(route, (c) =>
      c.json(present(setArchived(c.req.valid('param').id, archived)) as never, 200)
    )
  }
}
