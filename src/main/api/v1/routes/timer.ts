import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { timer } from '../../../core'
import { TimerStartInputV1, TimeEntryV1, toTimeEntry } from '../dto/timeEntries'
import { json, jsonBody, noContent } from '../../openapi'
import { errors } from '../errors'

const tags = ['Timer']

const get = createRoute({
  method: 'get',
  path: '/timer',
  tags,
  summary: 'Get the running timer',
  responses: { 200: json(TimeEntryV1.nullable(), 'The running timer, or null'), ...errors(409) }
})

const start = createRoute({
  method: 'post',
  path: '/timer/start',
  tags,
  summary: 'Start the timer',
  description:
    'Stops a running timer first. Start and end are rounded to whole minutes; only one timer runs, across all profiles.',
  request: { body: jsonBody(TimerStartInputV1) },
  responses: { 201: json(TimeEntryV1, 'The running timer'), ...errors(400, 404, 409) }
})

const stop = createRoute({
  method: 'post',
  path: '/timer/stop',
  tags,
  summary: 'Stop the timer and book its time',
  responses: { 204: noContent, ...errors(409) }
})

const discard = createRoute({
  method: 'post',
  path: '/timer/discard',
  tags,
  summary: 'Discard the timer without booking',
  responses: { 204: noContent, ...errors(409) }
})

export function registerTimerRoutes(v1: OpenAPIHono): void {
  v1.openapi(get, (c) => {
    const running = timer.get()
    return c.json(running && toTimeEntry(running), 200)
  })
  v1.openapi(start, (c) => {
    const { activityId, note: timerNote } = c.req.valid('json')
    return c.json(toTimeEntry(timer.start(activityId, timerNote)), 201)
  })
  v1.openapi(stop, (c) => {
    timer.stop()
    return c.body(null, 204)
  })
  v1.openapi(discard, (c) => {
    timer.discard()
    return c.body(null, 204)
  })
}
