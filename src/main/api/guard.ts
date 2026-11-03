import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { apiAccess } from '../core'
import { HttpError } from './errors'

/**
 * Lets through only local programs that know the API key. A browser sends an `Origin` header
 * and, after DNS rebinding, a foreign `Host`, so web pages can neither call nor read the API.
 */
export function guard(port: () => number): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const host = c.req.header('host')
    if (host !== `127.0.0.1:${port()}` && host !== `localhost:${port()}`) {
      throw new HttpError('INVALID_HOST')
    }
    if (c.req.header('origin') !== undefined) throw new HttpError('FORBIDDEN_ORIGIN')

    const key = /^Bearer (\S+)$/.exec(c.req.header('authorization') ?? '')?.[1]
    if (!key || !apiAccess.verifyKey(key)) throw new HttpError('UNAUTHORIZED')
    await next()
  })
}
