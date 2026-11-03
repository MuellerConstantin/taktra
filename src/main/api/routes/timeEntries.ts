import type { Hono } from 'hono'
import { timeEntryFilter } from '../../../shared/validation'
import { timeEntries } from '../../core'
import { toTimeEntry } from '../dto/timeEntries'
import { parse, toNumber } from '../parse'

export function registerTimeEntryRoutes(v1: Hono): void {
  v1.get('/time-entries', (c) => {
    const activityId = c.req.query('activityId')
    const filter = parse(timeEntryFilter, {
      from: c.req.query('from'),
      to: c.req.query('to'),
      activityId: activityId === undefined ? undefined : toNumber(activityId)
    })
    return c.json(timeEntries.list(filter).map(toTimeEntry))
  })
}
