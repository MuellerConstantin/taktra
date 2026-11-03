import type { ActivityWithTags } from '../../../shared/model/activities'
import type { ActivityDetails } from '../../../shared/model/timeEntries'
import { timestamp, toRef, type RefV1, type Timestamp } from './common'
import { toTag, type TagV1 } from './tags'

export interface ActivityV1 {
  readonly id: number
  readonly projectId: number
  readonly name: string
  readonly clientId: number | null
  readonly tagIds: readonly number[]
  readonly archivedAt: Timestamp | null
}

export function toActivity(activity: ActivityWithTags): ActivityV1 {
  return {
    id: activity.id,
    projectId: activity.projectId,
    name: activity.name,
    clientId: activity.clientId,
    tagIds: activity.tagIds,
    archivedAt: timestamp(activity.archivedAt)
  }
}

export interface ActivityDetailsV1 {
  readonly activity: RefV1 & { readonly archivedAt: Timestamp | null }
  readonly project: RefV1 & { readonly color: string | null; readonly archivedAt: Timestamp | null }
  /** The effective client: the project's, else the activity's own. */
  readonly client: RefV1 | null
  readonly tags: readonly TagV1[]
}

export function toActivityDetails(details: ActivityDetails): ActivityDetailsV1 {
  return {
    activity: {
      id: details.activity.id,
      name: details.activity.name,
      archivedAt: timestamp(details.activity.archivedAt)
    },
    project: {
      id: details.project.id,
      name: details.project.name,
      color: details.project.color,
      archivedAt: timestamp(details.project.archivedAt)
    },
    client: toRef(details.client),
    tags: details.tags.map(toTag)
  }
}
