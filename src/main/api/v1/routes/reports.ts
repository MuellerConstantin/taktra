import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { grouping } from '@/shared/validation'
import { reports } from '@/main/core'
import { ReportRowV1, toReportRow } from '@/main/api/v1/dto/reports'
import { json } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { splitList, timeFilterQuery } from '@/main/api/v1/params'

const report = createRoute({
  method: 'get',
  path: '/reports',
  tags: ['Reports'],
  summary: 'Sum booked time',
  description:
    'Sums the completed entries of a period, filtered and grouped. Lists are comma-separated, such as groupBy=project,tag.',
  request: {
    query: z.object({
      ...timeFilterQuery,
      groupBy: z
        .string()
        .transform(splitList)
        .pipe(grouping)
        .optional()
        .openapi({ description: 'Any of date, client, project, activity, tag.' })
    })
  },
  responses: { 200: json(z.array(ReportRowV1), 'One row per group'), ...errors(400) }
})

export function registerReportRoutes(v1: OpenAPIHono): void {
  v1.openapi(report, (c) => {
    const { groupBy, ...filter } = c.req.valid('query')
    return c.json(reports.aggregate(filter, groupBy ?? []).map(toReportRow), 200)
  })
}
