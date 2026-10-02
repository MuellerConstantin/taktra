import { createContext } from 'react'
import type { TimeEntryDetails } from '../../../shared/timeEntries'

export interface TimerContextValue {
  readonly running: TimeEntryDetails | null
  readonly revision: number
  readonly start: (activityId: number) => Promise<void>
  readonly stop: () => Promise<void>
  readonly discard: () => Promise<void>
}

export const TimerContext = createContext<TimerContextValue | null>(null)
