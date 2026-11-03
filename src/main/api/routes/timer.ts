import type { Hono } from 'hono'
import { z } from 'zod'
import { id, note } from '../../../shared/validation'
import { timer } from '../../core'
import { toTimeEntry } from '../dto/timeEntries'
import { parse, readBody } from '../parse'

const startInput = z.object({ activityId: id, note: note.optional() }).strict()

export function registerTimerRoutes(v1: Hono): void {
  v1.get('/timer', (c) => {
    const running = timer.get()
    return c.json(running && toTimeEntry(running))
  })
  v1.post('/timer/start', async (c) => {
    const { activityId, note: timerNote } = parse(startInput, await readBody(c))
    return c.json(toTimeEntry(timer.start(activityId, timerNote)))
  })
  v1.post('/timer/stop', (c) => {
    timer.stop()
    return c.json(null)
  })
}
