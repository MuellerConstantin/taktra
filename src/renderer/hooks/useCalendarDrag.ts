import type { CalendarDate, Time } from '@internationalized/date'
import { useEffect, useRef, useState } from 'react'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import {
  DAY_MINUTES,
  HOUR_HEIGHT,
  dateAt,
  dragSpan,
  layoutDay,
  snapEdge,
  timeOf,
  timedEntriesOn,
  type Block,
  type DragKind,
  type Span
} from '@/renderer/lib/calendar'

const DRAG_THRESHOLD = 4

interface Drag {
  readonly kind: DragKind
  readonly details: TimeEntryDetails | null
  readonly origin: Span
  readonly pointerX: number
  readonly pointerY: number
  readonly grab: number
  readonly span: Span
  readonly hasMoved: boolean
}

interface CalendarDragOptions {
  readonly days: readonly CalendarDate[]
  readonly entries: readonly TimeEntryDetails[]
  readonly now: number
  readonly firstHour: number
  readonly lastHour: number
  readonly onCreate: (day: CalendarDate, start: Time, end: Time) => void
  readonly onChange: (details: TimeEntryDetails, day: CalendarDate, start: Date, end: Date) => void
}

interface CalendarDrag {
  /** The entries with the dragged one where the drag puts it. */
  readonly shownEntries: readonly TimeEntryDetails[]
  readonly dragged: { readonly id: number; readonly span: Span } | null
  /** The range being drawn for a new entry. */
  readonly creating: Span | null
  readonly columnRef: (day: number) => (element: HTMLDivElement | null) => void
  /** Belongs in the capture phase of a day column: entry buttons stop the event from bubbling. */
  readonly handlePointerDown: (day: number, event: React.PointerEvent<HTMLDivElement>) => void
  /** Runs a press on an entry unless it was the release of a drag. */
  readonly pressEntry: (action: () => void) => void
}

/**
 * Creates, moves and resizes entries with the pointer in the columns of a calendar. Entries are
 * recognized by a `data-entry-id` attribute, their resize handles by `data-edge`.
 */
export function useCalendarDrag({
  days,
  entries,
  now,
  firstHour,
  lastHour,
  onCreate,
  onChange
}: CalendarDragOptions): CalendarDrag {
  const [drag, setDrag] = useState<Drag | null>(null)
  const [dropped, setDropped] = useState<{
    readonly drag: Drag
    readonly entries: readonly TimeEntryDetails[]
  } | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const wasDragged = useRef(false)
  const columns = useRef<(HTMLDivElement | null)[]>([])

  const blocksOn = (day: number, ignoredId: number | null = null): readonly Block[] =>
    layoutDay(
      days[day],
      timedEntriesOn(entries, days[day]).filter(({ entry }) => entry.id !== ignoredId),
      now
    )

  const edgesOn = (day: number, ignoredId: number | null): number[] =>
    blocksOn(day, ignoredId).flatMap((block) => [block.start, block.end])

  const minutesAt = (clientY: number): number => {
    const column = columns.current[0]
    if (!column) return 0
    return firstHour * 60 + ((clientY - column.getBoundingClientRect().top) / HOUR_HEIGHT) * 60
  }

  const dayAt = (clientX: number): number => {
    const index = columns.current.findIndex(
      (column) => column !== null && clientX < column.getBoundingClientRect().right
    )
    return index === -1 ? days.length - 1 : index
  }

  const updateDrag = (next: Drag | null): void => {
    dragRef.current = next
    setDrag(next)
  }

  const finishDrag = (done: Drag): void => {
    const { span, origin, details } = done
    const day = days[span.day]
    if (!details) {
      onCreate(day, timeOf(span.start), timeOf(Math.min(span.end, DAY_MINUTES - 1)))
      return
    }
    if (span.day === origin.day && span.start === origin.start && span.end === origin.end) return
    setDropped({ drag: done, entries })
    onChange(details, day, dateAt(day, span.start), dateAt(day, span.end))
  }

  const handlePointerDown = (day: number, event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    const pointer = minutesAt(event.clientY)
    const start = { pointerX: event.clientX, pointerY: event.clientY, hasMoved: false }
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
      const distance = Math.hypot(
        event.clientX - current.pointerX,
        event.clientY - current.pointerY
      )
      if (!current.hasMoved && distance < DRAG_THRESHOLD) return
      const ignoredId = current.details?.entry.id ?? null
      const span = dragSpan({
        ...current,
        pointer: minutesAt(event.clientY),
        pointerDay: dayAt(event.clientX),
        edgesOn: (day) => edgesOn(day, ignoredId),
        minStart: firstHour * 60,
        maxEnd: lastHour * 60,
        isFree: event.altKey
      })
      updateDrag({ ...current, hasMoved: true, span })
    }
    // Runs in the capture phase, before the entry button takes the release as a press.
    const handleUp = (): void => {
      const done = dragRef.current
      updateDrag(null)
      if (!done?.hasMoved) return
      wasDragged.current = true
      setTimeout(() => (wasDragged.current = false))
      finishDrag(done)
    }
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') updateDrag(null)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp, true)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp, true)
      window.removeEventListener('keydown', handleKey)
    }
  })

  // A dropped entry stays where it was dropped until the saved entries arrive, instead of
  // jumping back for the moment in between.
  const preview = drag?.hasMoved ? drag : dropped?.entries === entries ? dropped.drag : null
  const dragged = preview?.details ? { id: preview.details.entry.id, span: preview.span } : null
  const shownEntries = entries.map((details) => {
    if (details.entry.id !== dragged?.id) return details
    const day = days[dragged.span.day]
    const entry = {
      ...details.entry,
      date: day.toString(),
      startedAt: dateAt(day, dragged.span.start),
      endedAt: dateAt(day, dragged.span.end),
      durationSec: (dragged.span.end - dragged.span.start) * 60
    }
    return { ...details, entry }
  })

  return {
    shownEntries,
    dragged,
    creating: drag?.hasMoved && drag.kind === 'create' ? drag.span : null,
    columnRef: (day) => (element) => {
      columns.current[day] = element
    },
    handlePointerDown,
    pressEntry: (action) => {
      if (!wasDragged.current) action()
    }
  }
}
