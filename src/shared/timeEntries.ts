import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'
import type { timeEntries } from '../main/db/schema/timeEntries'
import type { Activity, ActivityTag } from './activities'
import type { Client } from './clients'
import type { Project } from './projects'
import type { timeEntryInput } from './validation/timeEntries'

export type TimeEntry = InferSelectModel<typeof timeEntries>

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

export interface TimeEntryRange {
  readonly from: string
  readonly to: string
}
