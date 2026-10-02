import type { ActivityRef, ActivityTag } from './activities'
import type { Project } from './projects'

export interface TimeFilter {
  readonly from?: string
  readonly to?: string
  readonly projectIds?: readonly number[]
  readonly activityIds?: readonly number[]
  readonly tagIds?: readonly number[]
}

export type Grouping = 'date' | 'project' | 'activity' | 'tag'

export interface AggregateRow {
  readonly date: string | null
  readonly project: Pick<Project, 'id' | 'name' | 'color'> | null
  readonly activity: ActivityRef | null
  readonly tag: ActivityTag | null
  readonly totalSec: number
  readonly entryCount: number
}
