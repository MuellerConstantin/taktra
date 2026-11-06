import {
  DateFormatter,
  getLocalTimeZone,
  isSameDay,
  type CalendarDate,
  type Time
} from '@internationalized/date'
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'
import { useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import { Button } from '@/renderer/components/atoms/Button'
import { CalendarEntry } from '@/renderer/components/molecules/timeEntries/CalendarEntry'
import { useCalendarDrag, type WeekDirection } from '@/renderer/hooks/useCalendarDrag'
import {
  DAY_MINUTES,
  HOUR_HEIGHT,
  MIN_BLOCK_HEIGHT,
  dateAt,
  layoutDay,
  timeOf,
  timedEntriesOn,
  type DragKind,
  type Span
} from '@/renderer/lib/calendar'
import { elapsedSeconds, formatDuration } from '@/renderer/lib/duration'
import { daysOf, weekNumberOf } from '@/renderer/lib/period'

const TWO_LINE_HEIGHT = 32
const SLOT_MINUTES = 30
const DEFAULT_FIRST_HOUR = 8
const DEFAULT_LAST_HOUR = 18

interface WeekCalendarProps {
  readonly days: readonly CalendarDate[]
  readonly entries: readonly TimeEntryDetails[]
  readonly today: CalendarDate
  readonly now: number
  readonly onOpenDay: (day: CalendarDate) => void
  readonly onCreate: (day: CalendarDate, start: Time, end?: Time) => void
  readonly onEdit: (details: TimeEntryDetails) => void
  readonly onChange: (details: TimeEntryDetails, day: CalendarDate, start: Date, end: Date) => void
  readonly onShiftWeek: (direction: WeekDirection) => void
}

export function WeekCalendar({
  days,
  entries,
  today,
  now,
  onOpenDay,
  onCreate,
  onEdit,
  onChange,
  onShiftWeek
}: WeekCalendarProps): React.JSX.Element {
  const t = useTranslations('WeekCalendar')
  const { locale } = useLocale()
  const timeZone = getLocalTimeZone()
  const weekdayFormatter = new DateFormatter(locale, { weekday: 'short' })
  const dayFormatter = new DateFormatter(locale, { day: 'numeric' })
  const fullDayFormatter = new DateFormatter(locale, { dateStyle: 'full' })
  const hourFormatter = new DateFormatter(locale, { hour: 'numeric' })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })

  // The visible hours follow the saved entries only, so they stay put while an entry is dragged.
  const savedBlocks = days.flatMap((day) => layoutDay(day, timedEntriesOn(entries, day), now))
  const firstHour = Math.min(
    DEFAULT_FIRST_HOUR,
    ...savedBlocks.map((block) => Math.floor(block.start / 60))
  )
  const lastHour = Math.max(
    DEFAULT_LAST_HOUR,
    ...savedBlocks.map((block) => Math.ceil(block.end / 60))
  )
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index)
  const top = (minutes: number): number => ((minutes - firstHour * 60) / 60) * HOUR_HEIGHT

  const {
    shownEntries,
    moved,
    nudged,
    creating,
    pointerLabel,
    weekEdges,
    scrollRef,
    headerRef,
    columnRef,
    handlePointerDown,
    handleEntryKeyDown,
    pressEntry
  } = useCalendarDrag({ days, entries, now, firstHour, lastHour, onCreate, onChange, onShiftWeek })

  const durationOf = ({ startedAt, endedAt, durationSec }: TimeEntryDetails['entry']): number =>
    startedAt && !endedAt ? elapsedSeconds(startedAt, now) : (durationSec ?? 0)
  const entriesOf = (day: CalendarDate): readonly TimeEntryDetails[] =>
    shownEntries.filter(({ entry }) => entry.date === day.toString())
  const blocksByDay = days.map((day) => layoutDay(day, timedEntriesOn(shownEntries, day), now))
  const untimedByDay = days.map((day) => entriesOf(day).filter(({ entry }) => !entry.startedAt))
  const hasUntimed = untimedByDay.some((list) => list.length > 0)

  const nowDate = new Date(now)
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()
  const showsNow = nowMinutes >= firstHour * 60 && nowMinutes <= lastHour * 60

  const describe = ({ entry, activity, project }: TimeEntryDetails): string => {
    const times = entry.startedAt
      ? `${timeFormatter.format(entry.startedAt)} – ${entry.endedAt ? timeFormatter.format(entry.endedAt) : t('now')}, `
      : ''
    return `${activity.name}, ${project.name}, ${times}${formatDuration(durationOf(entry))}`
  }
  const formatSpan = ({ day, start, end }: Span): string =>
    timeFormatter.formatRange(dateAt(day, start), dateAt(day, end))
  const nudgedEntry = shownEntries.find(({ entry }) => entry.id === nudged?.details.entry.id)

  const handleDoubleClick = (day: CalendarDate, event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) return
    const offset = event.clientY - event.currentTarget.getBoundingClientRect().top
    const slot = Math.floor(((offset / HOUR_HEIGHT) * 60) / SLOT_MINUTES) * SLOT_MINUTES
    const minutes = Math.min(firstHour * 60 + slot, DAY_MINUTES - SLOT_MINUTES)
    onCreate(day, timeOf(minutes))
  }

  const columns = { gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div ref={headerRef} className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="grid" style={columns}>
            <span />
            {days.map((day) => {
              const isToday = isSameDay(day, today)
              const total = entriesOf(day).reduce((sum, { entry }) => sum + durationOf(entry), 0)
              return (
                <Button
                  key={day.toString()}
                  variant="icon"
                  aria-label={t('openDay', { date: fullDayFormatter.format(day.toDate(timeZone)) })}
                  onPress={() => onOpenDay(day)}
                  className="w-full min-w-0 flex-col gap-0 rounded-none py-1.5 text-foreground"
                >
                  <span
                    className={
                      isToday ? 'text-sm font-semibold text-primary' : 'text-sm font-semibold'
                    }
                  >
                    {weekdayFormatter.format(day.toDate(timeZone))}{' '}
                    {dayFormatter.format(day.toDate(timeZone))}
                  </span>
                  <span
                    className={
                      total > 0
                        ? 'text-xs text-muted-foreground tabular-nums'
                        : 'text-xs text-muted-foreground/60 tabular-nums'
                    }
                  >
                    {formatDuration(total)}
                  </span>
                </Button>
              )
            })}
          </div>
          {hasUntimed && (
            <div className="grid border-t border-border" style={columns}>
              <span />
              {untimedByDay.map((list, index) => (
                <div
                  key={days[index].toString()}
                  className="flex min-w-0 flex-col gap-0.5 border-l border-border p-0.5"
                >
                  {list.map((details) => (
                    <CalendarEntry
                      key={details.entry.id}
                      details={details}
                      label={describe(details)}
                      onPress={() => onEdit(details)}
                      className="h-5"
                    >
                      <span className="truncate">{details.activity.name}</span>
                    </CalendarEntry>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="grid select-none" style={columns}>
          <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
            {hours.map((hour) => (
              <span
                key={hour}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] whitespace-nowrap text-muted-foreground tabular-nums first:translate-y-0.5"
                style={{ top: top(hour * 60) }}
              >
                {hourFormatter.format(new Date(2000, 0, 1, hour))}
              </span>
            ))}
          </div>
          {days.map((day, index) => (
            <div
              key={day.toString()}
              ref={columnRef(index)}
              onPointerDownCapture={(event) => handlePointerDown(day, event)}
              onDoubleClick={(event) => handleDoubleClick(day, event)}
              className={
                isSameDay(day, today)
                  ? 'relative border-l border-border bg-primary/5'
                  : 'relative border-l border-border'
              }
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((hour) => (
                <span
                  key={hour}
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                  style={{ top: top(hour * 60) }}
                />
              ))}
              {blocksByDay[index].map((block) => {
                const height = Math.max(
                  MIN_BLOCK_HEIGHT,
                  ((block.end - block.start) / 60) * HOUR_HEIGHT
                )
                const { entry, activity, project } = block.details
                const isRunning = entry.endedAt === null
                const draggedSpan = moved?.details.entry.id === entry.id ? moved.span : null
                return (
                  <CalendarEntry
                    key={entry.id}
                    details={block.details}
                    label={describe(block.details)}
                    onPress={() =>
                      pressEntry(() => (isRunning ? onOpenDay(day) : onEdit(block.details)))
                    }
                    onKeyDown={(event) => handleEntryKeyDown(block.details, event)}
                    isResizable={!isRunning && !block.isClipped}
                    isTooltipDisabled={pointerLabel !== null}
                    className={
                      isRunning
                        ? 'absolute ring-2 ring-primary'
                        : draggedSpan
                          ? 'absolute z-2 shadow-md'
                          : 'absolute'
                    }
                    style={{
                      top: top(block.start),
                      height: height - 1,
                      left: `calc(${(block.column / block.columns) * 100}% + 1px)`,
                      width: `calc(${100 / block.columns}% - 2px)`
                    }}
                  >
                    <span className="truncate font-medium">{activity.name}</span>
                    {height >= TWO_LINE_HEIGHT && (
                      <span className="truncate text-muted-foreground">
                        {draggedSpan ? formatSpan(draggedSpan) : project.name}
                      </span>
                    )}
                  </CalendarEntry>
                )
              })}
              {creating && isSameDay(creating.day, day) && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-px z-2 overflow-hidden rounded-sm border border-dashed border-primary bg-primary/10 px-1 py-px text-[11px] leading-3.5 text-foreground"
                  style={{
                    top: top(creating.start),
                    height: ((creating.end - creating.start) / 60) * HOUR_HEIGHT - 1
                  }}
                >
                  {formatSpan(creating)}
                </span>
              )}
              {showsNow && isSameDay(day, today) && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-1 border-t-2 border-primary"
                  style={{ top: top(nowMinutes) }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {pointerLabel && <PointerLabel {...pointerLabel} days={days} formatSpan={formatSpan} />}
      {weekEdges &&
        ([-1, 1] as const).map((direction) => {
          const Icon = direction === -1 ? RiArrowLeftSLine : RiArrowRightSLine
          const isActive = weekEdges.active === direction
          return (
            <div
              key={direction}
              aria-hidden
              data-week-edge={direction === -1 ? 'previous' : 'next'}
              className={`absolute inset-y-0 z-20 flex w-8 flex-col items-center justify-center gap-2 overflow-hidden border-border bg-background/90 text-muted-foreground ${direction === -1 ? 'left-0 border-r' : 'right-0 border-l'}`}
            >
              {isActive && (
                <span
                  key={weekEdges.count}
                  className="absolute inset-0 origin-bottom animate-fill-up bg-primary/20"
                />
              )}
              <Icon className={isActive ? 'relative size-5 text-primary' : 'relative size-5'} />
              <span
                className={`relative text-xs font-semibold [writing-mode:vertical-rl] ${isActive ? 'text-primary' : ''}`}
              >
                {t('week', {
                  week: weekNumberOf(days.map((day) => day.add({ weeks: direction })))
                })}
              </span>
            </div>
          )
        })}
      <span aria-live="polite" className="sr-only">
        {nudgedEntry ? describe(nudgedEntry) : ''}
      </span>
    </div>
  )
}

const POINTER_OFFSET = 16
const LABEL_SPACE = 260

interface PointerLabelProps {
  readonly kind: DragKind
  readonly span: Span
  readonly x: number
  readonly y: number
  readonly isOnWeekEdge: boolean
  readonly days: readonly CalendarDate[]
  readonly formatSpan: (span: Span) => string
}

/** Says beside the pointer where a dragged entry lands, with its week when it is moved. */
function PointerLabel({
  kind,
  span,
  x,
  y,
  isOnWeekEdge,
  days,
  formatSpan
}: PointerLabelProps): React.JSX.Element {
  const t = useTranslations('WeekCalendar')
  const { locale } = useLocale()
  const dayFormatter = new DateFormatter(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric'
  })
  const week = weekNumberOf(isOnWeekEdge ? days : daysOf(span.day, 'week', locale))
  const isLeft = x > window.innerWidth - LABEL_SPACE

  return (
    <span
      aria-hidden
      className="pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
      style={{
        left: isLeft ? x - POINTER_OFFSET : x + POINTER_OFFSET,
        top: y + POINTER_OFFSET,
        translate: isLeft ? '-100% 0' : undefined
      }}
    >
      {kind === 'move' && (
        <span key={week} className="animate-flash rounded-sm px-1 font-semibold text-primary">
          {t('week', { week })}
        </span>
      )}
      {!isOnWeekEdge && (
        <span>
          {dayFormatter.format(span.day.toDate(getLocalTimeZone()))} · {formatSpan(span)}
        </span>
      )}
    </span>
  )
}
