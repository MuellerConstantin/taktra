import {
  DateFormatter,
  Time,
  getLocalTimeZone,
  isSameDay,
  type CalendarDate
} from '@internationalized/date'
import { TooltipTrigger, useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { TimeEntryDetails } from '../../../../shared/timeEntries'
import { Button } from '../atoms/Button'
import { Tooltip } from '../atoms/Tooltip'
import { elapsedSeconds, formatDuration } from '../../lib/duration'

const HOUR_HEIGHT = 64
const MIN_BLOCK_HEIGHT = 16
const TWO_LINE_HEIGHT = 32
const SLOT_MINUTES = 30
const DEFAULT_FIRST_HOUR = 8
const DEFAULT_LAST_HOUR = 18
const DAY_MINUTES = 24 * 60
const TOOLTIP_DELAY = 500

interface Block {
  readonly details: TimeEntryDetails
  readonly start: number
  readonly end: number
  readonly column: number
  readonly columns: number
}

function minutesOn(day: CalendarDate, time: Date): number {
  const timeZone = getLocalTimeZone()
  if (time.getTime() < day.toDate(timeZone).getTime()) return 0
  if (time.getTime() >= day.add({ days: 1 }).toDate(timeZone).getTime()) return DAY_MINUTES
  return time.getHours() * 60 + time.getMinutes()
}

function layoutDay(
  day: CalendarDate,
  entries: readonly TimeEntryDetails[],
  now: number
): readonly Block[] {
  const spans = entries
    .map((details) => ({
      details,
      start: minutesOn(day, details.entry.startedAt ?? new Date(now)),
      end: minutesOn(day, details.entry.endedAt ?? new Date(now))
    }))
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

interface WeekCalendarProps {
  readonly days: readonly CalendarDate[]
  readonly entries: readonly TimeEntryDetails[]
  readonly today: CalendarDate
  readonly now: number
  readonly onOpenDay: (day: CalendarDate) => void
  readonly onCreate: (day: CalendarDate, start: Time) => void
  readonly onEdit: (details: TimeEntryDetails) => void
}

export function WeekCalendar({
  days,
  entries,
  today,
  now,
  onOpenDay,
  onCreate,
  onEdit
}: WeekCalendarProps): React.JSX.Element {
  const t = useTranslations('WeekCalendar')
  const { locale } = useLocale()
  const timeZone = getLocalTimeZone()
  const weekdayFormatter = new DateFormatter(locale, { weekday: 'short' })
  const dayFormatter = new DateFormatter(locale, { day: 'numeric' })
  const fullDayFormatter = new DateFormatter(locale, { dateStyle: 'full' })
  const hourFormatter = new DateFormatter(locale, { hour: 'numeric' })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })

  const durationOf = ({ startedAt, endedAt, durationSec }: TimeEntryDetails['entry']): number =>
    startedAt && !endedAt ? elapsedSeconds(startedAt, now) : (durationSec ?? 0)
  const entriesOf = (day: CalendarDate): readonly TimeEntryDetails[] =>
    entries.filter(({ entry }) => entry.date === day.toString())
  const blocksByDay = days.map((day) =>
    layoutDay(
      day,
      entriesOf(day).filter(({ entry }) => entry.startedAt),
      now
    )
  )
  const untimedByDay = days.map((day) => entriesOf(day).filter(({ entry }) => !entry.startedAt))
  const hasUntimed = untimedByDay.some((list) => list.length > 0)

  const blocks = blocksByDay.flat()
  const firstHour = Math.min(
    DEFAULT_FIRST_HOUR,
    ...blocks.map((block) => Math.floor(block.start / 60))
  )
  const lastHour = Math.max(DEFAULT_LAST_HOUR, ...blocks.map((block) => Math.ceil(block.end / 60)))
  const hours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index)
  const top = (minutes: number): number => ((minutes - firstHour * 60) / 60) * HOUR_HEIGHT

  const nowDate = new Date(now)
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()
  const showsNow = nowMinutes >= firstHour * 60 && nowMinutes <= lastHour * 60

  const describe = ({ entry, activity, project }: TimeEntryDetails): string => {
    const times = entry.startedAt
      ? `${timeFormatter.format(entry.startedAt)} – ${entry.endedAt ? timeFormatter.format(entry.endedAt) : t('now')}, `
      : ''
    return `${activity.name}, ${project.name}, ${times}${formatDuration(durationOf(entry))}`
  }

  const handleDoubleClick = (day: CalendarDate, event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) return
    const offset = event.clientY - event.currentTarget.getBoundingClientRect().top
    const slot = Math.floor(((offset / HOUR_HEIGHT) * 60) / SLOT_MINUTES) * SLOT_MINUTES
    const minutes = Math.min(firstHour * 60 + slot, DAY_MINUTES - SLOT_MINUTES)
    onCreate(day, new Time(Math.floor(minutes / 60), minutes % 60))
  }

  const columns = { gridTemplateColumns: `3rem repeat(${days.length}, minmax(0, 1fr))` }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-border bg-background">
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
                  <EntryButton
                    key={details.entry.id}
                    details={details}
                    label={describe(details)}
                    onPress={() => onEdit(details)}
                    className="h-5"
                  >
                    <span className="truncate">{details.activity.name}</span>
                  </EntryButton>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid" style={columns}>
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
              return (
                <EntryButton
                  key={entry.id}
                  details={block.details}
                  label={describe(block.details)}
                  onPress={() => (isRunning ? onOpenDay(day) : onEdit(block.details))}
                  className={isRunning ? 'absolute ring-2 ring-primary' : 'absolute'}
                  style={{
                    top: top(block.start),
                    height: height - 1,
                    left: `calc(${(block.column / block.columns) * 100}% + 1px)`,
                    width: `calc(${100 / block.columns}% - 2px)`
                  }}
                >
                  <span className="truncate font-medium">{activity.name}</span>
                  {height >= TWO_LINE_HEIGHT && (
                    <span className="truncate text-muted-foreground">{project.name}</span>
                  )}
                </EntryButton>
              )
            })}
            {showsNow && isSameDay(day, today) && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-[1] border-t-2 border-primary"
                style={{ top: top(nowMinutes) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface EntryButtonProps {
  readonly details: TimeEntryDetails
  readonly label: string
  readonly onPress: () => void
  readonly className: string
  readonly style?: React.CSSProperties
  readonly children: React.ReactNode
}

function EntryButton({
  details,
  label,
  onPress,
  className,
  style,
  children
}: EntryButtonProps): React.JSX.Element {
  const color = details.project.color ?? 'var(--color-muted-foreground)'
  return (
    <TooltipTrigger delay={TOOLTIP_DELAY}>
      <Button
        variant="secondary"
        tooltip={false}
        aria-label={label}
        onPress={onPress}
        className={`${className} min-w-0 flex-col items-stretch justify-start gap-0 overflow-hidden rounded-sm border-0 border-l-[3px] px-1 py-px text-left text-[11px] leading-[14px] text-foreground hover:brightness-95`}
        style={{
          ...style,
          borderLeftColor: color,
          backgroundColor: `color-mix(in srgb, ${color} 18%, var(--color-background))`
        }}
      >
        {children}
      </Button>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  )
}
