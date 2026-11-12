import { OpenAPIHono } from '@hono/zod-openapi'
import { createV1, V1_PATH } from './v1'
import { notFound as notFoundV1 } from './v1/errors'

/**
 * The whole API: each version is a sub-app below `/api/<version>` with its own access, error
 * format and description. Requests outside every version get a plain 404.
 */
export function createApp(port: () => number): OpenAPIHono {
  const app = new OpenAPIHono()
  app.route(V1_PATH, createV1(port))
  // A sub-app's own not-found handler is not used for its paths, so it is chosen here.
  app.notFound((c) =>
    c.req.path.startsWith(`${V1_PATH}/`) ? notFoundV1(c) : c.text('Not found', 404)
  )
  return app
}
