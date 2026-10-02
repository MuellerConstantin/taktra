import { and, asc, count, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm'
import { AppError } from '../shared/errors'
import type { AggregateRow, Grouping, TimeFilter } from '../shared/reports'
import { tagsByActivity } from './activities'
import { getActiveDatabase } from './db/database'
import { activities, activityTags, projects, tags, timeEntries } from './db/schema'
import { handle } from './ipc'
import { assertLocalDate } from './timeEntries'

const GROUPINGS: readonly Grouping[] = ['project', 'activity', 'tag']

function assertIds(ids: readonly number[] | undefined, field: string): void {
  if (ids && !(Array.isArray(ids) && ids.every(Number.isInteger)))
    throw new AppError('VALIDATION_FAILED', `Invalid ${field}`)
}

function conditions(filter: TimeFilter): SQL | undefined {
  if (filter.from !== undefined) assertLocalDate(filter.from)
  if (filter.to !== undefined) assertLocalDate(filter.to)
  assertIds(filter.projectIds, 'projectIds')
  assertIds(filter.activityIds, 'activityIds')
  assertIds(filter.tagIds, 'tagIds')

  const tagged = filter.tagIds
    ? getActiveDatabase()
        .select({ activityId: activityTags.activityId })
        .from(activityTags)
        .where(inArray(activityTags.tagId, [...filter.tagIds]))
    : undefined

  return and(
    filter.from === undefined ? undefined : gte(timeEntries.date, filter.from),
    filter.to === undefined ? undefined : lte(timeEntries.date, filter.to),
    filter.projectIds ? inArray(projects.id, [...filter.projectIds]) : undefined,
    filter.activityIds ? inArray(activities.id, [...filter.activityIds]) : undefined,
    tagged ? inArray(timeEntries.activityId, tagged) : undefined
  )
}

export function aggregate(filter: TimeFilter, groupBy: readonly Grouping[]): AggregateRow[] {
  if (!groupBy.every((grouping) => GROUPINGS.includes(grouping)))
    throw new AppError('VALIDATION_FAILED', `Invalid grouping: ${groupBy}`)

  const byActivity = groupBy.includes('activity')
  const byProject = byActivity || groupBy.includes('project')
  const byTag = groupBy.includes('tag')
  const none = sql<null>`null`

  const query = getActiveDatabase()
    .select({
      projectId: byProject ? projects.id : none,
      projectName: byProject ? projects.name : none,
      projectColor: byProject ? projects.color : none,
      activityId: byActivity ? activities.id : none,
      activityName: byActivity ? activities.name : none,
      tagId: byTag ? tags.id : none,
      tagName: byTag ? tags.name : none,
      tagColor: byTag ? tags.color : none,
      totalSec: sql<number>`coalesce(sum(${timeEntries.durationSec}), 0)`,
      entryCount: count(timeEntries.id)
    })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .$dynamic()

  const joined = byTag
    ? query
        .leftJoin(
          activityTags,
          and(
            eq(activityTags.activityId, activities.id),
            filter.tagIds ? inArray(activityTags.tagId, [...filter.tagIds]) : undefined
          )
        )
        .leftJoin(tags, eq(tags.id, activityTags.tagId))
    : query
  const filtered = joined.where(conditions(filter))

  const groupColumns = [
    ...(byProject ? [projects.id] : []),
    ...(byActivity ? [activities.id] : []),
    ...(byTag ? [tags.id] : [])
  ]
  const orderColumns = [
    ...(byProject ? [asc(sql`lower(${projects.name})`)] : []),
    ...(byActivity ? [asc(sql`lower(${activities.name})`)] : []),
    ...(byTag ? [sql`${tags.id} is null`, asc(sql`lower(${tags.name})`)] : [])
  ]
  const rows = (groupColumns.length > 0 ? filtered.groupBy(...groupColumns) : filtered)
    .orderBy(...orderColumns)
    .all()

  const tagMap = byActivity
    ? tagsByActivity(rows.map((row) => row.activityId).filter((id): id is number => id !== null))
    : new Map()

  return rows.map((row) => ({
    project:
      row.projectId === null
        ? null
        : { id: row.projectId, name: row.projectName ?? '', color: row.projectColor },
    activity:
      row.activityId === null
        ? null
        : {
            id: row.activityId,
            name: row.activityName ?? '',
            tags: tagMap.get(row.activityId) ?? []
          },
    tag:
      row.tagId === null ? null : { id: row.tagId, name: row.tagName ?? '', color: row.tagColor },
    totalSec: row.totalSec,
    entryCount: row.entryCount
  }))
}

export function initReports(): void {
  handle('reports:aggregate', (_, filter: TimeFilter, groupBy: readonly Grouping[]) =>
    aggregate(filter, groupBy)
  )
}
