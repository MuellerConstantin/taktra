import { isSameDay, parseDate, type CalendarDate, type Time } from '@internationalized/date'
import { useEffect, useRef, useState } from 'react'
import type { ButtonProps } from 'react-aria-components'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import {
  DAY_MINUTES,
  HOUR_HEIGHT,
  dateAt,
  dragSpan,
  layoutDay,
  nudgeSpan,
  snapEdge,
  timeOf,
  timedEntriesOn,
  type Block,
  type DragKind,
  type NudgeKind,
  type Span
} from '@/renderer/lib/calendar'
import { appShortcuts, matchesAccelerator } from '@/renderer/lib/shortcuts'

type EntryKeyboardEvent = Parameters<NonNullable<ButtonProps['onKeyDown']>>[0]

const DRAG_THRESHOLD = 4
const SCROLL_EDGE = 40
const MAX_SCROLL_STEP = 12
const WEEK_EDGE_DWELL = 700
const NUDGE_SAVE_DELAY = 600

const nudgeKeys: readonly (readonly [NudgeKind, string])[] = [
  ['earlier', appShortcuts.entryEarlier],
  ['later', appShortcuts.entryLater],
  ['shorter', appShortcuts.entryShorter],
  ['longer', appShortcuts.entryLonger],
  ['previousDay', appShortcuts.entryPreviousDay],
  ['nextDay', appShortcuts.entryNextDay]
]

interface Drag {
  readonly kind: DragKind
  readonly details: TimeEntryDetails | null
  readonly origin: Span
  readonly pointerX: number
  readonly pointerY: number
  /** Where the pointer is now, once the drag has moved. */
  readonly at: Pointer | null
  readonly grab: number
  readonly span: Span
  readonly hasMoved: boolean
}

interface Pointer {
  readonly x: number
  readonly y: number
  readonly isFree: boolean
}

/** An entry shown somewhere else than where it is saved. */
export interface MovedEntry {
  readonly details: TimeEntryDetails
  readonly span: Span
}

export type WeekDirection = -1 | 1

interface CalendarDragOptions {
  readonly days: readonly CalendarDate[]
  readonly entries: readonly TimeEntryDetails[]
  readonly now: number
  readonly firstHour: number
  readonly lastHour: number
  readonly onCreate: (day: CalendarDate, start: Time, end: Time) => void
  readonly onChange: (details: TimeEntryDetails, day: CalendarDate, start: Date, end: Date) => void
  readonly onShiftWeek: (direction: WeekDirection) => void
}

interface CalendarDrag {
  /** The entries with a dragged or nudged one where it is going. */
  readonly shownEntries: readonly TimeEntryDetails[]
  readonly moved: MovedEntry | null
  /** The entry being moved with the keyboard, to announce its new place. */
  readonly nudged: MovedEntry | null
  /** The range being drawn for a new entry. */
  readonly creating: Span | null
  /** What a drag would do, and where the pointer is, for a label beside it. */
  readonly pointerLabel: {
    readonly kind: DragKind
    readonly span: Span
    readonly x: number
    readonly y: number
    readonly isOnWeekEdge: boolean
  } | null
  /** Whether the edges for switching the week are shown, and which one is being held. */
  readonly weekEdges: {
    readonly active: WeekDirection | null
    readonly count: number
  } | null
  readonly scrollRef: React.RefObject<HTMLDivElement | null>
  readonly headerRef: React.RefObject<HTMLDivElement | null>
  readonly columnRef: (index: number) => (element: HTMLDivElement | null) => void
  /** Belongs in the capture phase of a day column: entry buttons stop the event from bubbling. */
  readonly handlePointerDown: (day: CalendarDate, event: React.PointerEvent<HTMLDivElement>) => void
  readonly handleEntryKeyDown: (details: TimeEntryDetails, event: EntryKeyboardEvent) => void
  /** Runs a press on an entry unless it was the release of a drag. */
  readonly pressEntry: (action: () => void) => void
}

/**
 * Creates, moves and resizes entries with the pointer in the columns of a calendar, and moves
 * them with the keyboard. Entries are recognized by a `data-entry-id` attribute, their resize
 * handles by `data-edge`, the edges that switch the week by `data-week-edge`.
 */
export function useCalendarDrag({
  days,
  entries,
  now,
  firstHour,
  lastHour,
  onCreate,
  onChange,
  onShiftWeek
}: CalendarDragOptions): CalendarDrag {
  const [drag, setDrag] = useState<Drag | null>(null)
  const [nudge, setNudge] = useState<MovedEntry | null>(null)
  const [dropped, setDropped] = useState<
    (MovedEntry & { readonly entries: readonly TimeEntryDetails[] }) | null
  >(null)
  const [weekEdge, setWeekEdge] = useState<{
    readonly direction: WeekDirection
    readonly count: number
  } | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const pointerRef = useRef<Pointer | null>(null)
  const wasDragged = useRef(false)
  const focusId = useRef<number | null>(null)
  const saveTimer = useRef<number | null>(null)
  const pendingSave = useRef<(() => void) | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const columns = useRef<(HTMLDivElement | null)[]>([])
  const latest = useRef({ entries, onChange, onShiftWeek })

  useEffect(() => {
    latest.current = { entries, onChange, onShiftWeek }
  })

  const minStart = firstHour * 60
  const maxEnd = lastHour * 60

  const blocksOn = (day: CalendarDate, ignoredId: number | null = null): readonly Block[] =>
    layoutDay(
      day,
      timedEntriesOn(entries, day).filter(({ entry }) => entry.id !== ignoredId),
      now
    )

  const edgesOn = (day: CalendarDate, ignoredId: number | null): number[] =>
    blocksOn(day, ignoredId).flatMap((block) => [block.start, block.end])

  const minutesAt = (clientY: number): number => {
    const column = columns.current[0]
    if (!column) return 0
    return minStart + ((clientY - column.getBoundingClientRect().top) / HOUR_HEIGHT) * 60
  }

  const dayAt = (clientX: number): CalendarDate => {
    const index = columns.current.findIndex(
      (column) => column !== null && clientX < column.getBoundingClientRect().right
    )
    return days[index === -1 ? days.length - 1 : index]
  }

  const weekEdgeAt = ({ x, y }: Pointer): WeekDirection | null => {
    const edge = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-week-edge]')
    if (!edge) return null
    return edge.dataset.weekEdge === 'previous' ? -1 : 1
  }

  const updateDrag = (next: Drag | null): void => {
    dragRef.current = next
    setDrag(next)
  }

  const followPointer = (current: Drag, pointer: Pointer): void => {
    const direction = current.kind === 'move' ? weekEdgeAt(pointer) : null
    setWeekEdge((edge) =>
      direction === null ? null : edge?.direction === direction ? edge : { direction, count: 0 }
    )
    if (direction !== null) {
      updateDrag({ ...current, hasMoved: true, at: pointer })
      return
    }
    const ignoredId = current.details?.entry.id ?? null
    const span = dragSpan({
      ...current,
      pointer: minutesAt(pointer.y),
      pointerDay: dayAt(pointer.x),
      edgesOn: (day) => edgesOn(day, ignoredId),
      minStart,
      maxEnd,
      isFree: pointer.isFree
    })
    updateDrag({ ...current, hasMoved: true, span, at: pointer })
  }

  const finishDrag = (done: Drag): void => {
    const { span, origin, details } = done
    if (!details) {
      onCreate(span.day, timeOf(span.start), timeOf(Math.min(span.end, DAY_MINUTES - 1)))
      return
    }
    const isUnchanged =
      isSameDay(span.day, origin.day) && span.start === origin.start && span.end === origin.end
    if (isUnchanged) return
    setDropped({ details, span, entries })
    onChange(details, span.day, dateAt(span.day, span.start), dateAt(span.day, span.end))
  }

  const handlePointerDown = (
    day: CalendarDate,
    event: React.PointerEvent<HTMLDivElement>
  ): void => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    const pointer = minutesAt(event.clientY)
    const start = { pointerX: event.clientX, pointerY: event.clientY, at: null, hasMoved: false }
    const entryElement = target.closest<HTMLElement>('[data-entry-id]')

    if (!entryElement) {
      if (target !== event.currentTarget) return
      event.preventDefault()
      const minutes = snapEdge(pointer, edgesOn(day, null), event.altKey)
      const origin = { day, start: minutes, end: minutes }
      updateDrag({ ...start, kind: 'create', details: null, origin, grab: 0, span: origin })
      return
    }

    const block = blocksOn(day).find(
      ({ details }) => String(details.entry.id) === entryElement.dataset.entryId
    )
    if (!block || block.details.entry.endedAt === null || block.isClipped) return
    const edge = target.closest<HTMLElement>('[data-edge]')?.dataset.edge
    const origin = { day, start: block.start, end: block.end }
    updateDrag({
      ...start,
      kind: edge === 'start' || edge === 'end' ? edge : 'move',
      details: block.details,
      origin,
      grab: pointer - block.start,
      span: origin
    })
  }

  const isDragging = drag !== null
  useEffect(() => {
    if (!isDragging) return
    const handleMove = (event: PointerEvent): void => {
      const current = dragRef.current
      if (!current) return
      pointerRef.current = { x: event.clientX, y: event.clientY, isFree: event.altKey }
      const distance = Math.hypot(
        event.clientX - current.pointerX,
        event.clientY - current.pointerY
      )
      if (!current.hasMoved && distance < DRAG_THRESHOLD) return
      followPointer(current, pointerRef.current)
    }
    // Content scrolled under a resting pointer moves the entry as well.
    const handleScroll = (): void => {
      const current = dragRef.current
      if (current?.hasMoved && pointerRef.current) followPointer(current, pointerRef.current)
    }
    // Runs in the capture phase, before the entry button takes the release as a press.
    const handleUp = (): void => {
      const done = dragRef.current
      const isOnWeekEdge = pointerRef.current !== null && weekEdgeAt(pointerRef.current) !== null
      updateDrag(null)
      setWeekEdge(null)
      pointerRef.current = null
      if (!done?.hasMoved) return
      wasDragged.current = true
      setTimeout(() => (wasDragged.current = false))
      if (!isOnWeekEdge) finishDrag(done)
    }
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      updateDrag(null)
      setWeekEdge(null)
    }

    let frame = 0
    const scrollNearEdges = (): void => {
      frame = requestAnimationFrame(scrollNearEdges)
      const container = scrollRef.current
      const pointer = pointerRef.current
      if (!container || !pointer || !dragRef.current?.hasMoved) return
      const top = headerRef.current?.getBoundingClientRect().bottom ?? 0
      const bottom = container.getBoundingClientRect().bottom
      const closeness =
        pointer.y < top + SCROLL_EDGE
          ? -(top + SCROLL_EDGE - pointer.y)
          : pointer.y > bottom - SCROLL_EDGE
            ? pointer.y - (bottom - SCROLL_EDGE)
            : 0
      const step = Math.max(-1, Math.min(1, closeness / SCROLL_EDGE)) * MAX_SCROLL_STEP
      if (step !== 0) container.scrollTop += step
    }
    frame = requestAnimationFrame(scrollNearEdges)

    const container = scrollRef.current
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp, true)
    window.addEventListener('keydown', handleKey)
    container?.addEventListener('scroll', handleScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp, true)
      window.removeEventListener('keydown', handleKey)
      container?.removeEventListener('scroll', handleScroll)
    }
  })

  useEffect(() => {
    if (!weekEdge) return
    const timer = setTimeout(() => {
      latest.current.onShiftWeek(weekEdge.direction)
      setWeekEdge({ ...weekEdge, count: weekEdge.count + 1 })
    }, WEEK_EDGE_DWELL)
    return () => clearTimeout(timer)
  }, [weekEdge])

  // An entry moved to another day or week is drawn anew, so the focus is put back on it.
  useEffect(() => {
    if (focusId.current === null) return
    const element = scrollRef.current?.querySelector<HTMLElement>(
      `[data-entry-id="${focusId.current}"]`
    )
    if (!element) return
    if (document.activeElement !== element) element.focus()
    element.scrollIntoView({ block: 'nearest' })
  })

  // Leaving the calendar before the save delay is over still saves the last keyboard move.
  useEffect(() => () => pendingSave.current?.(), [])

  const cancelSave = (): void => {
    if (saveTimer.current !== null) clearTimeout(saveTimer.current)
    saveTimer.current = null
    pendingSave.current = null
  }

  // A dropped entry stays where it was dropped until the saved entries arrive, instead of
  // jumping back for the moment in between.
  const settled = dropped?.entries === entries ? dropped : null
  const dragged = drag?.hasMoved && drag.details ? { details: drag.details, span: drag.span } : null
  const moved = dragged ?? nudge ?? settled

  const handleEntryKeyDown = (details: TimeEntryDetails, event: EntryKeyboardEvent): void => {
    const { entry } = details
    if (event.key === 'Escape' && nudge?.details.entry.id === entry.id) {
      cancelSave()
      setNudge(null)
      return
    }
    const kind = nudgeKeys.find(([, accelerator]) => matchesAccelerator(event, accelerator))?.[0]
    const block = blocksOn(parseDate(entry.date)).find(
      ({ details: other }) => other.entry.id === entry.id
    )
    if (!kind || entry.endedAt === null || block?.isClipped) {
      event.continuePropagation()
      return
    }
    event.preventDefault()

    const current =
      moved?.details.entry.id === entry.id
        ? moved.span
        : { day: parseDate(entry.date), start: block?.start ?? 0, end: block?.end ?? 0 }
    const next = nudgeSpan(current, kind, minStart, maxEnd)
    if (next.day.compare(days[0]) < 0) onShiftWeek(-1)
    if (next.day.compare(days[days.length - 1]) > 0) onShiftWeek(1)
    setNudge({ details, span: next })
    focusId.current = entry.id

    cancelSave()
    pendingSave.current = () => {
      cancelSave()
      focusId.current = null
      setDropped({ details, span: next, entries: latest.current.entries })
      setNudge(null)
      latest.current.onChange(
        details,
        next.day,
        dateAt(next.day, next.start),
        dateAt(next.day, next.end)
      )
    }
    saveTimer.current = window.setTimeout(() => pendingSave.current?.(), NUDGE_SAVE_DELAY)
  }

  const isShown = (day: CalendarDate): boolean => days.some((shown) => isSameDay(shown, day))
  const shownEntries = [
    ...entries.filter(({ entry }) => entry.id !== moved?.details.entry.id),
    ...(moved && isShown(moved.span.day)
      ? [
          {
            ...moved.details,
            entry: {
              ...moved.details.entry,
              date: moved.span.day.toString(),
              startedAt: dateAt(moved.span.day, moved.span.start),
              endedAt: dateAt(moved.span.day, moved.span.end),
              durationSec: (moved.span.end - moved.span.start) * 60
            }
          }
        ]
      : [])
  ]

  return {
    shownEntries,
    moved,
    nudged: nudge,
    creating: drag?.hasMoved && drag.kind === 'create' ? drag.span : null,
    pointerLabel:
      drag?.hasMoved && drag.at
        ? {
            kind: drag.kind,
            span: drag.span,
            x: drag.at.x,
            y: drag.at.y,
            isOnWeekEdge: weekEdge !== null
          }
        : null,
    weekEdges:
      drag?.hasMoved && drag.kind === 'move'
        ? { active: weekEdge?.direction ?? null, count: weekEdge?.count ?? 0 }
        : null,
    scrollRef,
    headerRef,
    columnRef: (index) => (element) => {
      columns.current[index] = element
    },
    handlePointerDown,
    handleEntryKeyDown,
    pressEntry: (action) => {
      if (!wasDragged.current) action()
    }
  }
}
