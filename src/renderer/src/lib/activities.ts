import type { ActivityWithTags } from '../../../shared/activities'
import { isSimilarName, toNameKey } from '../../../shared/names'

const SIMILAR_LIMIT = 5

export type ActivityOption =
  | { readonly id: number; readonly activity: ActivityWithTags }
  | { readonly id: 'new'; readonly name: string }

export function findActivityByName(
  activities: readonly ActivityWithTags[],
  projectId: number | null,
  name: string
): ActivityWithTags | undefined {
  const key = toNameKey(name)
  return activities.find(
    (activity) => activity.projectId === projectId && toNameKey(activity.name) === key
  )
}

/**
 * Activities of the chosen project that match the input, then similar ones from other projects
 * or the archive, so an existing activity is booked again instead of a near duplicate created.
 */
export function activityOptions(
  activities: readonly ActivityWithTags[],
  projectIds: ReadonlySet<number>,
  projectId: number | null,
  name: string,
  contains: (text: string, input: string) => boolean
): ActivityOption[] {
  const existing = findActivityByName(activities, projectId, name)
  const inProject = activities.filter(
    (activity) =>
      activity.projectId === projectId &&
      (activity === existing ||
        (activity.archivedAt === null && (existing || contains(activity.name, name))))
  )
  const similar = name
    ? activities
        .filter(
          (activity) =>
            !inProject.includes(activity) &&
            projectIds.has(activity.projectId) &&
            isSimilarName(activity.name, name)
        )
        .slice(0, SIMILAR_LIMIT)
    : []

  return [
    ...[...inProject, ...similar].map((activity) => ({ id: activity.id, activity })),
    ...(name && !existing ? [{ id: 'new' as const, name }] : [])
  ]
}
