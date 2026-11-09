import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activateDatabase, closeActiveDatabase } from '@/main/core/db/database'
import { createActivity } from '@/main/core/domain/activities'
import { createProject } from '@/main/core/domain/projects'
import { setTimerStart, startTimer, stopTimer } from '@/main/core/domain/timer'
import { createTestProfile } from '../../../profiles'

const NOW = new Date('2026-03-10T09:30:20')

let activityId: number

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  activateDatabase(createTestProfile())
  const projectId = createProject({ name: 'Alpha' }).id
  activityId = createActivity({ projectId, name: 'Build' }).id
})

afterEach(() => vi.useRealTimers())

afterAll(() => closeActiveDatabase())

describe('changing the start of the running timer', () => {
  it('moves the start to the whole minute and keeps the timer running', () => {
    startTimer(activityId)

    const { entry } = setTimerStart(new Date('2026-03-10T08:45:10'))

    expect(entry.startedAt).toEqual(new Date('2026-03-10T08:45:00'))
    expect(entry.endedAt).toBeNull()
    expect(entry.date).toBe('2026-03-10')
  })

  it('counts the entry towards the day of a start before midnight', () => {
    startTimer(activityId)

    expect(setTimerStart(new Date('2026-03-09T23:30:00')).entry.date).toBe('2026-03-09')
  })

  it('refuses a start later than now', () => {
    startTimer(activityId)

    expect(() => setTimerStart(new Date('2026-03-10T09:32:00'))).toThrow(
      expect.objectContaining({ code: 'TIMER_START_IN_FUTURE' })
    )
  })

  it('refuses a start more than a day ago', () => {
    startTimer(activityId)

    expect(() => setTimerStart(new Date('2026-03-09T09:29:00'))).toThrow(
      expect.objectContaining({ code: 'TIMER_START_TOO_EARLY' })
    )
  })

  it('refuses without a running timer', () => {
    startTimer(activityId)
    stopTimer()

    expect(() => setTimerStart(new Date('2026-03-10T09:00:00'))).toThrow(
      expect.objectContaining({ code: 'TIMER_NOT_RUNNING' })
    )
  })
})
