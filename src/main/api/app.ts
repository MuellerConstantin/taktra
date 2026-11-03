import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { isAppError } from '../../shared/model/errors'
import { HttpError, statusOf, ValidationError } from './errors'
import { streamEvents } from './events'
import { guard } from './guard'
import { registerRoutes } from './routes'

const MAX_BODY_BYTES = 64 * 1024

interface ErrorBody {
  readonly error: { readonly code: string; readonly message?: string }
}

function errorBody(code: string, message?: string): ErrorBody {
  return { error: message === undefined ? { code } : { code, message } }
}

/** The whole API; each version is a sub-app below `/api/<version>`. */
export function createApp(port: () => number): Hono {
  const v1 = new Hono()
  registerRoutes(v1)
  v1.get('/events', streamEvents)

  const app = new Hono()
  app.use(
    guard(port),
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => c.json(errorBody('PAYLOAD_TOO_LARGE'), 413)
    })
  )
  app.route('/api/v1', v1)

  app.notFound((c) => c.json(errorBody('ROUTE_NOT_FOUND'), 404))
  app.onError((error, c) => {
    if (error instanceof ValidationError) {
      return c.json(errorBody(error.code, error.details), 400)
    }
    if (error instanceof HttpError) {
      return c.json(errorBody(error.code), error.status)
    }
    if (isAppError(error)) {
      return c.json(errorBody(error.code), statusOf(error.code))
    }
    console.error(`API request ${c.req.method} ${c.req.path} failed`, error)
    return c.json(errorBody('UNKNOWN'), 500)
  })
  return app
}
