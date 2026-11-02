import { z } from 'zod'
import { id, note } from '../../../shared/validation'
import { timer } from '../../core'
import { handle } from './handle'

export function registerTimerHandlers(): void {
  handle('timer:get', z.tuple([]), () => timer.get())
  handle('timer:start', z.tuple([id, note.optional()]), (_, activityId, timerNote) =>
    timer.start(activityId, timerNote)
  )
  handle('timer:stop', z.tuple([]), () => timer.stop())
  handle('timer:discard', z.tuple([]), () => timer.discard())
  handle('timer:recent', z.tuple([id.max(50)]), (_, limit) => timer.recentActivities(limit))
}
