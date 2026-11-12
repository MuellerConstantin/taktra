import { z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { isAppError, type InputIssue } from '@/shared/model/errors'
import { HttpError, statusOf } from '@/main/api/errors'
import { json } from '@/main/api/openapi'

/** The error format of version 1, for every response that is not a success. */
export const ErrorV1 = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'PROJECT_NOT_FOUND' }),
      issues: z
        .array(
          z.object({
            path: z.string().openapi({
              description:
                'The wrong field, nested names joined by dots; empty for the whole input.',
              example: '0.optionId'
            }),
            message: z.string().openapi({ description: 'For people; the wording may change.' })
          })
        )
        .optional()
        .openapi({ description: 'Only for VALIDATION_FAILED: what is wrong, one per field.' })
    })
  })
  .openapi('Error')

type ErrorV1 = z.infer<typeof ErrorV1>

function errorBody(code: string, issues?: readonly InputIssue[]): ErrorV1 {
  return { error: issues === undefined ? { code } : { code, issues: issues.map(toIssue) } }
}

/** Names of the core that the inputs of v1 call differently. */
const inputNames: Readonly<Record<string, string>> = {
  startedAt: 'start',
  endedAt: 'end',
  textValue: 'value'
}

function toIssue({ path, message }: InputIssue): { path: string; message: string } {
  const names = path.map((key) => (typeof key === 'string' ? (inputNames[key] ?? key) : key))
  return { path: names.join('.'), message }
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
  if (error instanceof HttpError) return c.json(errorBody(error.code), error.status)
  if (isAppError(error, 'VALIDATION_FAILED'))
    return c.json(errorBody(error.code, error.issues), 400)
  if (isAppError(error)) return c.json(errorBody(error.code), statusOf(error.code))
  // Hono's JSON validator throws this for a body that is not valid JSON.
  if (error instanceof HTTPException && error.status === 400) {
    return c.json(errorBody('INVALID_JSON'), 400)
  }
  console.error(`API request ${c.req.method} ${c.req.path} failed`, error)
  return c.json(errorBody('UNKNOWN'), 500)
}
