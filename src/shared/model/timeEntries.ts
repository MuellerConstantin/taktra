import type { z } from 'zod'
import type { Activity, ActivityTag } from './activities'
import type { Client } from './clients'
import type { Project } from './projects'
import type { timeEntryInput } from '../validation/timeEntries'

export interface TimeEntry {
  readonly id: number
  readonly activityId: number
  /** The local day the entry counts towards. */
  readonly date: string
  readonly startedAt: Date | null
  readonly endedAt: Date | null
  readonly timezone: string | null
  readonly durationSec: number | null
  readonly note: string | null
}

export type TimeEntryTimes =
  | { readonly startedAt: Date; readonly endedAt: Date; readonly timezone: string }
  | { readonly durationSec: number }

export type TimeEntryInput = z.input<typeof timeEntryInput>

export type TimeEntryData = z.output<typeof timeEntryInput>

export interface TimeEntryDetails {
  readonly entry: TimeEntry
  readonly activity: Pick<Activity, 'id' | 'name' | 'archivedAt'>
  readonly project: Pick<Project, 'id' | 'name' | 'color' | 'archivedAt'>
  readonly client: Pick<Client, 'id' | 'name'> | null
  readonly tags: readonly ActivityTag[]
}

export type ActivityDetails = Omit<TimeEntryDetails, 'entry'>

export interface TimeEntryFilter {
  readonly from?: string
  readonly to?: string
  readonly activityId?: number
}
