import { and, count, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import type { AggregateRow, Grouping, TimeFilter } from '../../shared/reports'
import { grouping, timeFilter } from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { activities, activityTags, clients, projects, tags, timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { tagsByActivity } from './activities'
import { effectiveClientId, effectiveClientJoin } from './clients'
import { compareNames } from './names'

export function conditions(filter: TimeFilter): SQL | undefined {
  const tagged = filter.tagIds
    ? getActiveDatabase()
        .select({ activityId: activityTags.activityId })
        .from(activityTags)
        .where(inArray(activityTags.tagId, [...filter.tagIds]))
    : undefined

  return and(
    filter.from === undefined ? undefined : gte(timeEntries.date, filter.from),
    filter.to === undefined ? undefined : lte(timeEntries.date, filter.to),
    filter.clientIds ? inArray(effectiveClientId, [...filter.clientIds]) : undefined,
    filter.projectIds ? inArray(projects.id, [...filter.projectIds]) : undefined,
    filter.activityIds ? inArray(activities.id, [...filter.activityIds]) : undefined,
    tagged ? inArray(timeEntries.activityId, tagged) : undefined
  )
}

function compareRows(a: AggregateRow, b: AggregateRow): number {
  if (a.date !== b.date) return (a.date ?? '') < (b.date ?? '') ? -1 : 1
  return (
    Number(a.client === null) - Number(b.client === null) ||
    compareNames(a.client?.name ?? '', b.client?.name ?? '') ||
    compareNames(a.project?.name ?? '', b.project?.name ?? '') ||
    compareNames(a.activity?.name ?? '', b.activity?.name ?? '') ||
    Number(a.tag === null) - Number(b.tag === null) ||
    compareNames(a.tag?.name ?? '', b.tag?.name ?? '')
  )
}

export function aggregate(filter: TimeFilter, groupBy: readonly Grouping[]): AggregateRow[] {
  const byDate = groupBy.includes('date')
  const byClient = groupBy.includes('client')
  const byActivity = groupBy.includes('activity')
  const byProject = byActivity || groupBy.includes('project')
  const byTag = groupBy.includes('tag')
  const none = sql<null>`null`

  const query = getActiveDatabase()
    .select({
      date: byDate ? timeEntries.date : none,
      clientId: byClient ? clients.id : none,
      clientName: byClient ? clients.name : none,
      projectId: byProject ? projects.id : none,
      projectName: byProject ? projects.name : none,
      projectColor: byProject ? projects.color : none,
      activityId: byActivity ? activities.id : none,
      activityProjectId: byActivity ? activities.projectId : none,
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

  const withClients = byClient ? query.leftJoin(clients, effectiveClientJoin) : query
  const joined = byTag
    ? withClients
        .leftJoin(
          activityTags,
          and(
            eq(activityTags.activityId, activities.id),
            filter.tagIds ? inArray(activityTags.tagId, [...filter.tagIds]) : undefined
          )
        )
        .leftJoin(tags, eq(tags.id, activityTags.tagId))
    : withClients
  const filtered = joined.where(conditions(filter))

  const groupColumns = [
    ...(byDate ? [timeEntries.date] : []),
    ...(byClient ? [clients.id] : []),
    ...(byProject ? [projects.id] : []),
    ...(byActivity ? [activities.id] : []),
    ...(byTag ? [tags.id] : [])
  ]
  const rows = (groupColumns.length > 0 ? filtered.groupBy(...groupColumns) : filtered).all()

  const tagMap = byActivity
    ? tagsByActivity(rows.map((row) => row.activityId).filter((id): id is number => id !== null))
    : new Map()

  const result: AggregateRow[] = rows.map((row) => ({
    date: row.date,
    client: row.clientId === null ? null : { id: row.clientId, name: row.clientName ?? '' },
    project:
      row.projectId === null
        ? null
        : { id: row.projectId, name: row.projectName ?? '', color: row.projectColor },
    activity:
      row.activityId === null
        ? null
        : {
            id: row.activityId,
            projectId: row.activityProjectId ?? 0,
            name: row.activityName ?? '',
            tags: tagMap.get(row.activityId) ?? []
          },
    tag:
      row.tagId === null ? null : { id: row.tagId, name: row.tagName ?? '', color: row.tagColor },
    totalSec: row.totalSec,
    entryCount: row.entryCount
  }))
  return result.sort(compareRows)
}

export function initReports(): void {
  handle('reports:aggregate', z.tuple([timeFilter, grouping]), (_, filter, groupBy) =>
    aggregate(filter, groupBy)
  )
}
