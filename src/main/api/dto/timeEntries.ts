import type { TimeEntryDetails } from '../../../shared/model/timeEntries'
import { toActivityDetails, type ActivityDetailsV1 } from './activities'
import { timestamp, type Timestamp } from './common'

export interface TimeEntryV1 extends ActivityDetailsV1 {
  readonly id: number
  /** The local day the entry counts towards. */
  readonly date: string
  readonly start: Timestamp | null
  /** `null` while the timer runs, and for entries recorded with a duration only. */
  readonly end: Timestamp | null
  readonly timezone: string | null
  readonly durationSec: number | null
  readonly note: string | null
}

export function toTimeEntry(details: TimeEntryDetails): TimeEntryV1 {
  const { entry } = details
  return {
    id: entry.id,
    date: entry.date,
    start: timestamp(entry.startedAt),
    end: timestamp(entry.endedAt),
    timezone: entry.timezone,
    durationSec: entry.durationSec,
    note: entry.note,
    ...toActivityDetails(details)
  }
}
