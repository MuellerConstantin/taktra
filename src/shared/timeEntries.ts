import type { InferSelectModel } from 'drizzle-orm'
import type { timeEntries } from '../main/db/schema/timeEntries'
import type { Activity, ActivityTag } from './activities'
import type { Project } from './projects'

export type TimeEntry = InferSelectModel<typeof timeEntries>

export type TimeEntryTimes =
  | { readonly startedAt: Date; readonly endedAt: Date; readonly timezone: string }
  | { readonly durationSec: number }

export type TimeEntryInput = {
  readonly activityId: number
  readonly date: string
  readonly note?: string | null
} & TimeEntryTimes

export interface TimeEntryDetails {
  readonly entry: TimeEntry
  readonly activity: Pick<Activity, 'id' | 'name'>
  readonly project: Pick<Project, 'id' | 'name' | 'color'>
  readonly tags: readonly ActivityTag[]
}

export interface TimeEntryRange {
  readonly from: string
  readonly to: string
}
