import { z } from 'zod'
import { id, note } from '../../../shared/validation'
import {
  discardTimer,
  getRunningTimer,
  listRecentActivities,
  startTimer,
  stopTimer
} from '../../core/domain/timer'
import { handle } from './handle'

export function initTimer(): void {
  handle('timer:get', z.tuple([]), () => getRunningTimer())
  handle('timer:start', z.tuple([id, note.optional()]), (_, activityId, timerNote) =>
    startTimer(activityId, timerNote)
  )
  handle('timer:stop', z.tuple([]), () => stopTimer())
  handle('timer:discard', z.tuple([]), () => discardTimer())
  handle('timer:recent', z.tuple([id.max(50)]), (_, limit) => listRecentActivities(limit))
}
