import { z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { isAppError } from '../../../shared/model/errors'
import { HttpError, statusOf, ValidationError } from '../errors'
import { json } from '../openapi'

/** The error format of version 1, for every response that is not a success. */
export const ErrorV1 = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'PROJECT_NOT_FOUND' }),
      message: z
        .string()
        .optional()
        .openapi({ description: 'Only for invalid requests: which fields are wrong.' })
    })
  })
  .openapi('Error')

type ErrorV1 = z.infer<typeof ErrorV1>

function errorBody(code: string, message?: string): ErrorV1 {
  return { error: message === undefined ? { code } : { code, message } }
}

const errorDescriptions = {
  400: 'The request is invalid',
  401: 'The API key is missing or wrong',
  404: 'The resource does not exist',
  409: 'The request conflicts with the current data, such as a taken name',
  413: 'The body is larger than 64 KB',
  415: 'The body is not JSON'
} as const

type ErrorStatus = keyof typeof errorDescriptions

/** The error responses a route can give, besides the ones every route can give. */
export function errors<Status extends ErrorStatus>(
  ...statuses: Status[]
): Record<Status | 401, ReturnType<typeof json<typeof ErrorV1>>> {
  return Object.fromEntries(
    [401 as const, ...statuses].map((status) => [status, json(ErrorV1, errorDescriptions[status])])
  ) as Record<Status | 401, ReturnType<typeof json<typeof ErrorV1>>>
}

export function notFound(c: Context): Response {
  return c.json(errorBody('ROUTE_NOT_FOUND'), 404)
}

export function tooLarge(c: Context): Response {
  return c.json(errorBody('PAYLOAD_TOO_LARGE'), 413)
}

export function handleError(error: Error, c: Context): Response {
  if (error instanceof ValidationError) return c.json(errorBody(error.code, error.details), 400)
  if (error instanceof HttpError) return c.json(errorBody(error.code), error.status)
  if (isAppError(error)) return c.json(errorBody(error.code), statusOf(error.code))
  // Hono's JSON validator throws this for a body that is not valid JSON.
  if (error instanceof HTTPException && error.status === 400) {
    return c.json(errorBody('INVALID_JSON'), 400)
  }
  console.error(`API request ${c.req.method} ${c.req.path} failed`, error)
  return c.json(errorBody('UNKNOWN'), 500)
}
