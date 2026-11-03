import type { Hono } from 'hono'
import { z } from 'zod'
import { note, timeEntryFilter, timeEntryInput } from '../../../shared/validation'
import { timeEntries } from '../../core'
import { toTimeEntry } from '../dto/timeEntries'
import { idParam, parse, readBody, toDate, toNumber } from '../parse'

const noteInput = z.object({ note }).strict()

/**
 * An entry has `durationSec`, or `start`, `end` and `timezone`, named as in the response; the
 * core calls the times `startedAt` and `endedAt`.
 */
function toInput(body: unknown): z.output<typeof timeEntryInput> {
  if (typeof body !== 'object' || body === null || !('start' in body || 'end' in body)) {
    return parse(timeEntryInput, body)
  }
  const { start, end, ...rest } = body as Record<string, unknown>
  return parse(timeEntryInput, { ...rest, startedAt: toDate(start), endedAt: toDate(end) })
}

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
  v1.get('/time-entries/:id', (c) => c.json(toTimeEntry(timeEntries.get(idParam(c)))))
  v1.post('/time-entries', async (c) => {
    const entry = timeEntries.create(toInput(await readBody(c)))
    return c.json(toTimeEntry(timeEntries.get(entry.id)), 201)
  })
  v1.put('/time-entries/:id', async (c) => {
    const entry = timeEntries.update(idParam(c), toInput(await readBody(c)))
    return c.json(toTimeEntry(timeEntries.get(entry.id)))
  })
  v1.put('/time-entries/:id/note', async (c) => {
    const entryId = idParam(c)
    timeEntries.setNote(entryId, parse(noteInput, await readBody(c)).note)
    return c.json(toTimeEntry(timeEntries.get(entryId)))
  })
  v1.delete('/time-entries/:id', (c) => {
    timeEntries.delete(idParam(c))
    return c.body(null, 204)
  })
}
