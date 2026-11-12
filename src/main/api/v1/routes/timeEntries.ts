import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { localDate, timeEntryInput } from '@/shared/validation'
import { timeEntries } from '@/main/core'
import {
  NoteInputV1,
  TimeEntryInputV1,
  TimeEntryV1,
  toTimeEntry
} from '@/main/api/v1/dto/timeEntries'
import { json, jsonBody, noContent } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { idParams, idQuery } from '@/main/api/v1/params'
import { parse } from '@/main/api/parse'

const tags = ['Time entries']

/** The core calls the times `startedAt` and `endedAt` and checks them as dates. */
function toInput(input: TimeEntryInputV1): z.output<typeof timeEntryInput> {
  if ('durationSec' in input) return parse(timeEntryInput, input)
  const { start, end, ...rest } = input
  return parse(timeEntryInput, { ...rest, startedAt: new Date(start), endedAt: new Date(end) })
}

const list = createRoute({
  method: 'get',
  path: '/time-entries',
  tags,
  summary: 'List time entries',
  description: 'Completed entries and the running timer, by date.',
  request: {
    query: z.object({ from: localDate.optional(), to: localDate.optional(), activityId: idQuery })
  },
  responses: { 200: json(z.array(TimeEntryV1), 'The entries'), ...errors(400) }
})

const get = createRoute({
  method: 'get',
  path: '/time-entries/{id}',
  tags,
  summary: 'Get a time entry',
  request: { params: idParams },
  responses: { 200: json(TimeEntryV1, 'The entry'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/time-entries',
  tags,
  summary: 'Book a time entry',
  request: { body: jsonBody(TimeEntryInputV1) },
  responses: { 201: json(TimeEntryV1, 'The new entry'), ...errors(400, 404, 409) }
})

const replace = createRoute({
  method: 'put',
  path: '/time-entries/{id}',
  tags,
  summary: 'Replace a time entry',
  description: 'The running timer cannot be replaced; only its note changes.',
  request: { params: idParams, body: jsonBody(TimeEntryInputV1) },
  responses: { 200: json(TimeEntryV1, 'The changed entry'), ...errors(400, 404, 409) }
})

const setNote = createRoute({
  method: 'put',
  path: '/time-entries/{id}/note',
  tags,
  summary: 'Set the note of a time entry',
  description: 'Also works while the timer runs. An empty note removes it.',
  request: { params: idParams, body: jsonBody(NoteInputV1) },
  responses: { 200: json(TimeEntryV1, 'The entry'), ...errors(400, 404) }
})

const remove = createRoute({
  method: 'delete',
  path: '/time-entries/{id}',
  tags,
  summary: 'Delete a time entry',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404) }
})

export function registerTimeEntryRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => c.json(timeEntries.list(c.req.valid('query')).map(toTimeEntry), 200))
  v1.openapi(get, (c) => c.json(toTimeEntry(timeEntries.get(c.req.valid('param').id)), 200))
  v1.openapi(create, (c) => {
    const entry = timeEntries.create(toInput(c.req.valid('json')))
    return c.json(toTimeEntry(timeEntries.get(entry.id)), 201)
  })
  v1.openapi(replace, (c) => {
    const entry = timeEntries.update(c.req.valid('param').id, toInput(c.req.valid('json')))
    return c.json(toTimeEntry(timeEntries.get(entry.id)), 200)
  })
  v1.openapi(setNote, (c) => {
    const entryId = c.req.valid('param').id
    timeEntries.setNote(entryId, c.req.valid('json').note)
    return c.json(toTimeEntry(timeEntries.get(entryId)), 200)
  })
  v1.openapi(remove, (c) => {
    timeEntries.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
}
