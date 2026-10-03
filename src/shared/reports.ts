import type { ActivityRef, ActivityTag } from './activities'
import type { Project } from './projects'

export interface TimeFilter {
  readonly from?: string
  readonly to?: string
  readonly projectIds?: readonly number[]
  readonly activityIds?: readonly number[]
  readonly tagIds?: readonly number[]
}

export const groupings = ['date', 'project', 'activity', 'tag'] as const

export type Grouping = (typeof groupings)[number]

export interface AggregateRow {
  readonly date: string | null
  readonly project: Pick<Project, 'id' | 'name' | 'color'> | null
  readonly activity: ActivityRef | null
  readonly tag: ActivityTag | null
  readonly totalSec: number
  readonly entryCount: number
}
