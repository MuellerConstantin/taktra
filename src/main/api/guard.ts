import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { apiAccess } from '@/main/core'
import { HttpError } from './errors'

/** The description of a version, which holds nothing secret, so tools fetch it without the key. */
const SPEC_PATH = /^\/api\/v\d+\/openapi\.json$/

/**
 * Lets through only local programs that know the API key. A browser sends an `Origin` header
 * and, after DNS rebinding, a foreign `Host`, so web pages can neither call nor read the API.
 * A body must be JSON, which also keeps forms of web pages out.
 */
export function guard(port: () => number): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const host = c.req.header('host')
    if (host !== `127.0.0.1:${port()}` && host !== `localhost:${port()}`) {
      throw new HttpError('INVALID_HOST')
    }
    if (c.req.header('origin') !== undefined) throw new HttpError('FORBIDDEN_ORIGIN')

    if (!SPEC_PATH.test(c.req.path)) {
      const key = /^Bearer (\S+)$/.exec(c.req.header('authorization') ?? '')?.[1]
      if (!key || !apiAccess.verifyKey(key)) throw new HttpError('UNAUTHORIZED')
    }

    const type = c.req.header('content-type')
    if (type !== undefined && !type.startsWith('application/json')) {
      throw new HttpError('UNSUPPORTED_MEDIA_TYPE')
    }
    await next()
  })
}
