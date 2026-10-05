import { parseDate, startOfMonth, startOfWeek, type CalendarDate } from '@internationalized/date'
import type { AggregateRow } from '../../../shared/reports'
import { COLORS } from './colors'
import type { DateRange } from './period'

export type Bucket = 'day' | 'week' | 'month'

export const NEUTRAL_COLOR = '#78716c'
const UNTAGGED_COLOR = '#d6d3d1'

export interface Kpis {
  readonly totalSec: number
  readonly trackedDays: number
}

export function computeKpis(rows: readonly AggregateRow[]): Kpis {
  return {
    totalSec: rows.reduce((sum, row) => sum + row.totalSec, 0),
    trackedDays: new Set(rows.map((row) => row.date)).size
  }
}

export function dataRange(rows: readonly AggregateRow[]): DateRange | null {
  const dates = rows.flatMap((row) => (row.date ? [row.date] : [])).sort()
  if (dates.length === 0) return null
  return { start: parseDate(dates[0]), end: parseDate(dates[dates.length - 1]) }
}

export function bucketFor({ start, end }: DateRange): Bucket {
  const days = end.compare(start) + 1
  if (days <= 31) return 'day'
  if (days <= 183) return 'week'
  return 'month'
}

export function bucketStart(date: CalendarDate, bucket: Bucket, locale: string): CalendarDate {
  if (bucket === 'week') return startOfWeek(date, locale)
  if (bucket === 'month') return startOfMonth(date)
  return date
}

export function bucketStarts(range: DateRange, bucket: Bucket, locale: string): CalendarDate[] {
  const step = bucket === 'day' ? { days: 1 } : bucket === 'week' ? { weeks: 1 } : { months: 1 }
  const starts: CalendarDate[] = []
  for (
    let current = bucketStart(range.start, bucket, locale);
    current.compare(range.end) <= 0;
    current = current.add(step)
  ) {
    starts.push(current)
  }
  return starts
}

export interface ShareItem {
  readonly id: string
  readonly label: string
  readonly color: string
  readonly totalSec: number
  readonly children: readonly ShareItem[]
}

type ChildOf = (row: AggregateRow) => Omit<ShareItem, 'children'> | null

const byTotal = (a: ShareItem, b: ShareItem): number => b.totalSec - a.totalSec

export function projectTotals(rows: readonly AggregateRow[]): ReadonlyMap<number, number> {
  const totals = new Map<number, number>()
  for (const { project, totalSec } of rows) {
    if (project) totals.set(project.id, (totals.get(project.id) ?? 0) + totalSec)
  }
  return totals
}

export function projectShares(
  rows: readonly AggregateRow[],
  totals: ReadonlyMap<number, number>,
  childOf: ChildOf
): ShareItem[] {
  const groups = new Map<number, ShareItem>()
  for (const row of rows) {
    if (!row.project) continue
    const group = groups.get(row.project.id) ?? {
      id: `project-${row.project.id}`,
      label: row.project.name,
      color: row.project.color ?? NEUTRAL_COLOR,
      totalSec: totals.get(row.project.id) ?? 0,
      children: []
    }
    const child = childOf(row)
    groups.set(row.project.id, {
      ...group,
      children: child ? [...group.children, { ...child, children: [] }] : group.children
    })
  }
  return [...groups.values()]
    .map((group) => ({ ...group, children: [...group.children].sort(byTotal) }))
    .sort(byTotal)
}

/** Clients have no color of their own; the id keeps a client's color stable across reports. */
function clientColor(clientId: number): string {
  return COLORS[(clientId - 1) % COLORS.length]
}

export function clientShares(rows: readonly AggregateRow[], noClientLabel: string): ShareItem[] {
  const groups = new Map<number | null, ShareItem>()
  for (const row of rows) {
    const key = row.client?.id ?? null
    const group = groups.get(key) ?? {
      id: `client-${key ?? 'none'}`,
      label: row.client?.name ?? noClientLabel,
      color: row.client ? clientColor(row.client.id) : UNTAGGED_COLOR,
      totalSec: 0,
      children: []
    }
    const child = row.project && {
      id: `project-${row.project.id}`,
      label: row.project.name,
      color: row.project.color ?? NEUTRAL_COLOR,
      totalSec: row.totalSec,
      children: []
    }
    groups.set(key, {
      ...group,
      totalSec: group.totalSec + row.totalSec,
      children: child ? [...group.children, child] : group.children
    })
  }
  return [...groups.values()]
    .map((group) => ({ ...group, children: [...group.children].sort(byTotal) }))
    .sort(byTotal)
}

export function tagShare(row: AggregateRow, untaggedLabel: string): Omit<ShareItem, 'children'> {
  return {
    id: `tag-${row.tag?.id ?? 'none'}`,
    label: row.tag?.name ?? untaggedLabel,
    color: row.tag ? (row.tag.color ?? NEUTRAL_COLOR) : UNTAGGED_COLOR,
    totalSec: row.totalSec
  }
}

export function tagShares(rows: readonly AggregateRow[], untaggedLabel: string): ShareItem[] {
  return rows.map((row) => ({ ...tagShare(row, untaggedLabel), children: [] })).sort(byTotal)
}
