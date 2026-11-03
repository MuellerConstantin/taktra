import type { Hono } from 'hono'
import { grouping, timeFilter } from '../../../shared/validation'
import { reports } from '../../core'
import { toReportRow } from '../dto/reports'
import { parse, toList, toNumber } from '../parse'

export function registerReportRoutes(v1: Hono): void {
  v1.get('/reports', (c) => {
    const filter = parse(timeFilter, {
      from: c.req.query('from'),
      to: c.req.query('to'),
      clientIds: toList(c.req.query('clientIds'), toNumber),
      projectIds: toList(c.req.query('projectIds'), toNumber),
      activityIds: toList(c.req.query('activityIds'), toNumber),
      tagIds: toList(c.req.query('tagIds'), toNumber)
    })
    const groupBy = parse(grouping, toList(c.req.query('groupBy')) ?? [])
    return c.json(reports.aggregate(filter, groupBy).map(toReportRow))
  })
}
