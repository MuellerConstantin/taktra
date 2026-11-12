import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { activateDatabase, closeActiveDatabase } from '@/main/core/db/database'
import { createActivity } from '@/main/core/domain/activities'
import { createProject } from '@/main/core/domain/projects'
import {
  createTimeEntry,
  deleteTimeEntry,
  moveTimeEntryToDay,
  updateTimeEntry
} from '@/main/core/domain/timeEntries'
import { discardTimer, getRunningTimer, startTimer } from '@/main/core/domain/timer'
import { on, type AppEvent } from '@/main/core/events'
import { createTestProfile } from '../../../profiles'

let activityId: number

beforeEach(() => {
  activateDatabase(createTestProfile())
  const projectId = createProject({ name: 'Alpha' }).id
  activityId = createActivity({ projectId, name: 'Build' }).id
})

afterAll(() => closeActiveDatabase())

describe('moving an entry to another day', () => {
  it('keeps the clock times across a change to daylight saving time', () => {
    const entry = createTimeEntry({
      activityId,
      date: '2026-03-27',
      note: 'Planning',
      startedAt: new Date('2026-03-27T08:00:00Z'),
      endedAt: new Date('2026-03-27T09:30:00Z'),
      timezone: 'Europe/Berlin'
    })

    const moved = moveTimeEntryToDay(entry.id, '2026-03-30')

    expect(moved).toEqual({
      ...entry,
      date: '2026-03-30',
      startedAt: new Date('2026-03-30T07:00:00Z'),
      endedAt: new Date('2026-03-30T08:30:00Z')
    })
  })

  it('changes only the day of an entry with a duration only', () => {
    const entry = createTimeEntry({ activityId, date: '2026-03-02', note: null, durationSec: 1800 })

    expect(moveTimeEntryToDay(entry.id, '2026-02-27')).toEqual({ ...entry, date: '2026-02-27' })
  })

  it('refuses the running timer', () => {
    const { entry } = startTimer(activityId)

    expect(() => moveTimeEntryToDay(entry.id, '2026-03-02')).toThrow(
      expect.objectContaining({ code: 'TIME_ENTRY_RUNNING' })
    )
  })

  it('refuses an entry that does not exist', () => {
    expect(() => moveTimeEntryToDay(999, '2026-03-02')).toThrow(
      expect.objectContaining({ code: 'TIME_ENTRY_NOT_FOUND' })
    )
  })
})

describe('the running timer as an entry', () => {
  function recordEvents(): AppEvent[] {
    const received: AppEvent[] = []
    on('signal:timer', () => received.push('signal:timer'))
    return received
  }

  it('cannot be replaced, so it keeps running', () => {
    const { entry } = startTimer(activityId)

    expect(() =>
      updateTimeEntry(entry.id, { activityId, date: '2026-03-02', note: null, durationSec: 60 })
    ).toThrow(expect.objectContaining({ code: 'TIME_ENTRY_RUNNING' }))
    expect(getRunningTimer()?.entry.id).toBe(entry.id)
  })

  it('reports the timer as changed when it is deleted', () => {
    const { entry } = startTimer(activityId)
    const received = recordEvents()

    deleteTimeEntry(entry.id)

    expect(getRunningTimer()).toBeNull()
    expect(received).toEqual(['signal:timer'])
  })

  it('reports a discarded timer once', () => {
    startTimer(activityId)
    const received = recordEvents()

    discardTimer()

    expect(received).toEqual(['signal:timer'])
  })
})
