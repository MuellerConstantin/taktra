import type { Context } from 'hono'
import { z } from 'zod'
import { id } from '../../shared/validation'
import { HttpError, ValidationError } from './errors'

/** All problems in one line, such as `activityId: Invalid input: expected number, received undefined`. */
function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ` : '') + issue.message)
    .join('; ')
}

/** Validates with the schemas of shared/validation/, as the IPC handlers do. */
export function parse<Schema extends z.ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ValidationError(describeIssues(parsed.error))
  return parsed.data
}

/*
 * Path and query values are strings; these turn them into what the schemas expect. A value
 * they cannot read is passed on unchanged, so the schema rejects it.
 */

export function toNumber(value: string): unknown {
  return /^\d+$/.test(value) ? Number(value) : value
}

export function toBoolean(value: string | undefined): unknown {
  if (value === undefined) return undefined
  return value === 'true' ? true : value === 'false' ? false : value
}

/** A comma-separated list, such as `?projectIds=1,2`. */
export function toList(
  value: string | undefined,
  item: (value: string) => unknown = (part) => part
): unknown {
  return value === undefined ? undefined : value.split(',').map(item)
}

/** The `:id` of the path, named in the error message if it is invalid. */
export function idParam(c: Context): number {
  return parse(z.object({ id }), { id: toNumber(c.req.param('id') ?? '') }).id
}

/** The JSON body, if any; a body in another format is refused rather than guessed. */
export async function readBody(c: Context): Promise<unknown> {
  const text = await c.req.text()
  if (text === '') return undefined
  if (!c.req.header('content-type')?.startsWith('application/json')) {
    throw new HttpError('UNSUPPORTED_MEDIA_TYPE')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError('INVALID_JSON')
  }
}

/** Clock times arrive as ISO strings; the schemas expect dates and reject invalid ones. */
export function toDate(value: unknown): unknown {
  return typeof value === 'string' ? new Date(value) : value
}
