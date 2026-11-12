import { z } from '@hono/zod-openapi'
import { localDate } from '@/shared/validation'

/*
 * How version 1 encodes values in paths and queries, which are strings: these turn them into
 * what the schemas of the core expect.
 */

export const idParams = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ param: { name: 'id', in: 'path' }, example: 1 })
})

export const booleanQuery = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional()

export const idQuery = z.coerce.number().int().positive().optional()

/** Splits a comma-separated list, such as `?projectIds=1,2`. */
export function splitList(value: string): string[] {
  return value.split(',')
}

export const idListQuery = z
  .string()
  .transform(splitList)
  .pipe(z.array(z.coerce.number<string>().int().positive()))
  .optional()

/** The period and filter of reports and exports. */
export const timeFilterQuery = {
  from: localDate.optional(),
  to: localDate.optional(),
  clientIds: idListQuery,
  projectIds: idListQuery,
  activityIds: idListQuery,
  tagIds: idListQuery
}
