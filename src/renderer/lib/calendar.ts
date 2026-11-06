import { Time, getLocalTimeZone, type CalendarDate } from '@internationalized/date'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'

export const HOUR_HEIGHT = 64
export const MIN_BLOCK_HEIGHT = 16
export const DAY_MINUTES = 24 * 60
export const SNAP_MINUTES = 15
const SNAP_DISTANCE = 8

export interface Block {
  readonly details: TimeEntryDetails
  readonly start: number
  readonly end: number
  readonly column: number
  readonly columns: number
  /** The entry reaches into another day, so dragging it here would cut it off. */
  readonly isClipped: boolean
}

/** A time range in minutes of a day. */
export interface Span {
  readonly day: CalendarDate
  readonly start: number
  readonly end: number
}

export type DragKind = 'create' | 'move' | 'start' | 'end'

function minutesOn(day: CalendarDate, time: Date): number {
  const timeZone = getLocalTimeZone()
  if (time.getTime() < day.toDate(timeZone).getTime()) return 0
  if (time.getTime() >= day.add({ days: 1 }).toDate(timeZone).getTime()) return DAY_MINUTES
  return time.getHours() * 60 + time.getMinutes()
}

export function dateAt(day: CalendarDate, minutes: number): Date {
  const date = day.toDate(getLocalTimeZone())
  date.setMinutes(minutes)
  return date
}

export function timeOf(minutes: number): Time {
  return new Time(Math.floor(minutes / 60), minutes % 60)
}

export function timedEntriesOn(
  entries: readonly TimeEntryDetails[],
  day: CalendarDate
): TimeEntryDetails[] {
  return entries.filter(({ entry }) => entry.date === day.toString() && entry.startedAt)
}

/** Places the entries of a day side by side where they overlap. */
export function layoutDay(
  day: CalendarDate,
  entries: readonly TimeEntryDetails[],
  now: number
): readonly Block[] {
  const timeZone = getLocalTimeZone()
  const spans = entries
    .map((details) => {
      const startedAt = details.entry.startedAt ?? new Date(now)
      const endedAt = details.entry.endedAt ?? new Date(now)
      return {
        details,
        start: minutesOn(day, startedAt),
        end: minutesOn(day, endedAt),
        isClipped:
          startedAt.getTime() < day.toDate(timeZone).getTime() ||
          endedAt.getTime() > day.add({ days: 1 }).toDate(timeZone).getTime()
      }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const shownEnd = ({ start, end }: (typeof spans)[number]): number =>
    Math.max(end, start + (MIN_BLOCK_HEIGHT / HOUR_HEIGHT) * 60)

  const groups: (typeof spans)[] = []
  let groupEnd = -1
  for (const span of spans) {
    if (span.start >= groupEnd) groups.push([])
    groups[groups.length - 1].push(span)
    groupEnd = Math.max(groupEnd, shownEnd(span))
  }

  return groups.flatMap((group) => {
    const columnEnds: number[] = []
    const placed = group.map((span) => {
      const free = columnEnds.findIndex((end) => end <= span.start)
      const column = free === -1 ? columnEnds.length : free
      columnEnds[column] = shownEnd(span)
      return { ...span, column }
    })
    return placed.map((span) => ({ ...span, columns: columnEnds.length }))
  })
}

/**
 * Moves an edge onto the nearest edge of another entry within reach, else onto the grid, so
 * entries meet without gaps and land on round times. `isFree` only rounds to the minute.
 */
export function snapEdge(minutes: number, edges: readonly number[], isFree: boolean): number {
  if (isFree) return Math.round(minutes)
  const reach = (SNAP_DISTANCE / HOUR_HEIGHT) * 60
  const near = edges.filter((edge) => Math.abs(edge - minutes) <= reach)
  if (near.length === 0) return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
  return near.reduce((best, edge) =>
    Math.abs(edge - minutes) < Math.abs(best - minutes) ? edge : best
  )
}

/** Snaps a moved entry by whichever of its two edges needs the smaller correction. */
function snapStart(
  start: number,
  length: number,
  edges: readonly number[],
  isFree: boolean
): number {
  const byStart = snapEdge(start, edges, isFree)
  const byEnd = snapEdge(start + length, edges, isFree) - length
  return Math.abs(byEnd - start) < Math.abs(byStart - start) ? byEnd : byStart
}

export interface DragInput {
  readonly kind: DragKind
  readonly origin: Span
  /** Minutes between the grabbed point and the start of a moved entry. */
  readonly grab: number
  /** Minutes of the day under the pointer, and the day it is over. */
  readonly pointer: number
  readonly pointerDay: CalendarDate
  /** The edges of the other entries a day offers to snap to. */
  readonly edgesOn: (day: CalendarDate) => readonly number[]
  readonly minStart: number
  readonly maxEnd: number
  readonly isFree: boolean
}

/** Where a drag puts the entry: moved as a whole, one edge resized, or drawn anew. */
export function dragSpan({
  kind,
  origin,
  grab,
  pointer,
  pointerDay,
  edgesOn,
  minStart,
  maxEnd,
  isFree
}: DragInput): Span {
  const minLength = isFree ? 1 : SNAP_MINUTES

  if (kind === 'move') {
    const length = origin.end - origin.start
    const start = snapStart(pointer - grab, length, edgesOn(pointerDay), isFree)
    const clamped = Math.min(Math.max(start, minStart), maxEnd - length)
    return { day: pointerDay, start: clamped, end: clamped + length }
  }

  const edge = Math.min(Math.max(snapEdge(pointer, edgesOn(origin.day), isFree), minStart), maxEnd)
  if (kind === 'start') return { ...origin, start: Math.min(edge, origin.end - minLength) }
  if (kind === 'end') return { ...origin, end: Math.max(edge, origin.start + minLength) }
  return edge >= origin.start
    ? { ...origin, end: Math.max(edge, origin.start + minLength) }
    : { ...origin, start: Math.min(edge, origin.start - minLength), end: origin.start }
}

export type NudgeKind = 'earlier' | 'later' | 'shorter' | 'longer' | 'previousDay' | 'nextDay'

/**
 * Moves an entry by a grid step or a day, or changes its end by a grid step, as the keyboard
 * does. A start or end off the grid first moves onto it.
 */
export function nudgeSpan(span: Span, kind: NudgeKind, minStart: number, maxEnd: number): Span {
  const length = span.end - span.start
  const step = (minutes: number, direction: 1 | -1): number =>
    direction === 1
      ? Math.floor(minutes / SNAP_MINUTES) * SNAP_MINUTES + SNAP_MINUTES
      : Math.ceil(minutes / SNAP_MINUTES) * SNAP_MINUTES - SNAP_MINUTES

  switch (kind) {
    case 'earlier':
    case 'later': {
      const start = step(span.start, kind === 'later' ? 1 : -1)
      const clamped = Math.min(Math.max(start, minStart), maxEnd - length)
      return { ...span, start: clamped, end: clamped + length }
    }
    case 'shorter':
    case 'longer': {
      const end = step(span.end, kind === 'longer' ? 1 : -1)
      const minEnd = span.start + Math.min(SNAP_MINUTES, length)
      return { ...span, end: Math.min(Math.max(end, minEnd), maxEnd) }
    }
    case 'previousDay':
      return { ...span, day: span.day.subtract({ days: 1 }) }
    case 'nextDay':
      return { ...span, day: span.day.add({ days: 1 }) }
  }
}
