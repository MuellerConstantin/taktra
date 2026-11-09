import { describe, expect, it } from 'vitest'
import type { ActivityDetails, TimeEntryDetails } from '@/shared/model/timeEntries'
import { NO_PROJECT_COLOR, taskbarItems } from '@/main/gui/taskbarItems'

function activity(id: number, name: string): ActivityDetails {
  return {
    activity: { id, name, archivedAt: null },
    project: { id: 1, name: 'Internal', color: null, archivedAt: null },
    client: null,
    tags: []
  }
}

function running(details: ActivityDetails): TimeEntryDetails {
  return {
    ...details,
    entry: {
      id: 1,
      activityId: details.activity.id,
      date: '2026-11-09',
      startedAt: new Date('2026-11-09T08:00:00Z'),
      endedAt: null,
      timezone: 'Europe/Berlin',
      durationSec: null,
      note: null
    }
  }
}

describe('taskbar items', () => {
  it('offers nothing without a timer or recent activities', () => {
    expect(taskbarItems('en', null, [])).toEqual({
      recentTitle: 'Recently used',
      recent: [],
      stop: null
    })
  })

  it('offers to stop the running timer instead of starting its activity again', () => {
    const meeting = activity(3, 'Meeting')

    expect(taskbarItems('de', running(meeting), [meeting, activity(4, 'Review')])).toEqual({
      recentTitle: 'Zuletzt verwendet',
      recent: [
        { title: 'Review – Internal', options: { startActivity: 4 }, color: NO_PROJECT_COLOR }
      ],
      stop: { title: 'Meeting – Internal stoppen', options: { stopTimer: true } }
    })
  })

  it('shows the project color of an activity to start', () => {
    const colored = {
      ...activity(5, 'Design'),
      project: { id: 2, name: 'Web', color: '#22c55e', archivedAt: null }
    }

    expect(taskbarItems('en', null, [colored]).recent[0].color).toBe('#22c55e')
  })

  it('offers at most five recent activities', () => {
    const recent = Array.from({ length: 6 }, (_, index) => activity(index + 1, `Task ${index}`))

    expect(taskbarItems('en', null, recent).recent).toHaveLength(5)
  })
})
