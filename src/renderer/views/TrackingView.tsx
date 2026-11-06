import {
  DateFormatter,
  fromDate,
  getLocalTimeZone,
  isSameDay,
  parseDate,
  startOfWeek,
  today,
  toTime,
  type CalendarDate,
  type Time
} from '@internationalized/date'
import {
  RiAddLine,
  RiCalendarScheduleLine,
  RiDeleteBinLine,
  RiMore2Line,
  RiPencilLine,
  RiPlayFill,
  RiStopFill
} from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { TooltipTrigger, useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { TimeEntryDetails } from '@/shared/model/timeEntries'
import { AlertDialog } from '@/renderer/components/atoms/AlertDialog'
import { Button } from '@/renderer/components/atoms/Button'
import { GridList, GridListItem } from '@/renderer/components/atoms/GridList'
import { Menu, MenuItem, MenuTrigger } from '@/renderer/components/atoms/Menu'
import { Modal } from '@/renderer/components/atoms/Modal'
import { ToggleButton } from '@/renderer/components/atoms/ToggleButton'
import { ToggleButtonGroup } from '@/renderer/components/atoms/ToggleButtonGroup'
import { Tooltip } from '@/renderer/components/atoms/Tooltip'
import { DayViewIcon, WeekViewIcon, WorkWeekViewIcon } from '@/renderer/components/atoms/ViewIcons'
import { DayNavigator } from '@/renderer/components/molecules/timeEntries/DayNavigator'
import { MoveTimeEntryDialog } from '@/renderer/components/molecules/timeEntries/MoveTimeEntryDialog'
import { ExpandableNote } from '@/renderer/components/molecules/Note'
import { TagBadges } from '@/renderer/components/molecules/tags/TagBadges'
import { TimeEntryDialog } from '@/renderer/components/molecules/timeEntries/TimeEntryDialog'
import { ViewHeader } from '@/renderer/components/molecules/ViewHeader'
import { WeekCalendar } from '@/renderer/components/organisms/WeekCalendar'
import { useErrorMessage } from '@/renderer/hooks/useErrorMessage'
import { useNow } from '@/renderer/hooks/useNow'
import { useProfiles } from '@/renderer/hooks/useProfiles'
import { useShortcut } from '@/renderer/hooks/useShortcut'
import { useCreateRequest } from '@/renderer/hooks/useCreateRequest'
import { useTimer } from '@/renderer/hooks/useTimer'
import { api } from '@/renderer/lib/api'
import { elapsedSeconds, formatDuration } from '@/renderer/lib/duration'
import { daysOf, weekNumberOf, type CalendarRange } from '@/renderer/lib/period'
import { appShortcuts } from '@/renderer/lib/shortcuts'
import { useDataRevision } from '@/renderer/hooks/useDataRevision'

const rangeOptions = [
  { id: 'day', Icon: DayViewIcon },
  { id: 'workWeek', Icon: WorkWeekViewIcon },
  { id: 'week', Icon: WeekViewIcon }
] as const

function parseRange(value: string | null): CalendarRange {
  return value === 'workWeek' || value === 'week' ? value : 'day'
}

function parseDay(value: string | null, fallback: CalendarDate): CalendarDate {
  if (!value) return fallback
  try {
    return parseDate(value)
  } catch {
    return fallback
  }
}

type Row =
  | { readonly kind: 'entry'; readonly id: number; readonly details: TimeEntryDetails }
  | { readonly kind: 'gap'; readonly id: string; readonly start: Date; readonly end: Date }
  | { readonly kind: 'withoutTimes'; readonly id: string }

/**
 * Lists the entries with clock times by start, with the untracked time between them, and the
 * entries with a duration only as a block after them.
 */
function toRows(entries: readonly TimeEntryDetails[], now: number): Row[] {
  const timed = entries.filter(({ entry }) => entry.startedAt)
  const untimed = entries.filter(({ entry }) => !entry.startedAt)

  let lastEnd: number | null = null
  const timedRows = timed.flatMap((details): Row[] => {
    const { id, startedAt, endedAt } = details.entry
    const entryRow: Row = { kind: 'entry', id, details }
    const start = startedAt?.getTime() ?? 0
    const gapStart = lastEnd
    lastEnd = Math.max(lastEnd ?? 0, endedAt?.getTime() ?? now)
    return gapStart !== null && start - gapStart >= 60_000
      ? [
          { kind: 'gap', id: `gap-${id}`, start: new Date(gapStart), end: new Date(start) },
          entryRow
        ]
      : [entryRow]
  })
  const untimedRows = untimed.map((details): Row => ({
    kind: 'entry',
    id: details.entry.id,
    details
  }))

  if (timedRows.length === 0) return untimedRows
  if (untimedRows.length === 0) return timedRows
  return [...timedRows, { kind: 'withoutTimes', id: 'withoutTimes' }, ...untimedRows]
}

function TrackingView(): React.JSX.Element {
  const t = useTranslations('TrackingView')
  const errorMessage = useErrorMessage()
  const dataRevision = useDataRevision()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
  const [searchParams, setSearchParams] = useSearchParams()
  const todayDate = today(getLocalTimeZone())
  const date = parseDay(searchParams.get('date'), todayDate)
  const unit = parseRange(searchParams.get('range'))
  const weekStart = startOfWeek(date, locale)
  const days = daysOf(date, unit, locale)
  const from = days[0].toString()
  const to = days[days.length - 1].toString()
  const [entries, setEntries] = useState<readonly TimeEntryDetails[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{
    readonly date: CalendarDate
    readonly start?: Time
    readonly end?: Time
    readonly details?: TimeEntryDetails
  } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [entryToDelete, setEntryToDelete] = useState<TimeEntryDetails | null>(null)
  const [entryToMove, setEntryToMove] = useState<TimeEntryDetails | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { running, revision, start, stop, discard } = useTimer()
  const isRunningShown =
    running !== null && (entries ?? []).some(({ entry }) => entry.id === running.entry.id)
  const now = useNow(isRunningShown)
  const durationOf = ({ startedAt, endedAt, durationSec }: TimeEntryDetails['entry']): number =>
    startedAt && !endedAt ? elapsedSeconds(startedAt, now) : (durationSec ?? 0)

  const timeZone = getLocalTimeZone()
  const dayFormatter = new DateFormatter(locale, { dateStyle: 'long' })
  const mediumDayFormatter = new DateFormatter(locale, { dateStyle: 'medium' })
  const weekdayFormatter = new DateFormatter(locale, { weekday: 'long' })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })
  const total = (entries ?? []).reduce((sum, { entry }) => sum + durationOf(entry), 0)
  const rows = toRows(entries ?? [], now)
  const showsTimes = (entries ?? []).some(({ entry }) => entry.startedAt)
  const newEntryDate =
    unit !== 'day' && !days.some((weekDay) => isSameDay(weekDay, todayDate)) ? days[0] : date

  useEffect(() => {
    let isCurrent = true
    api.timeEntries
      .list({ from, to })
      .then((result) => {
        if (!isCurrent) return
        setEntries(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, from, to, reloadCount, revision, dataRevision, errorMessage])

  const thisWeekStart = startOfWeek(todayDate, locale)
  const title =
    unit !== 'day'
      ? isSameDay(weekStart, thisWeekStart)
        ? t('thisWeek')
        : isSameDay(weekStart, thisWeekStart.subtract({ weeks: 1 }))
          ? t('lastWeek')
          : isSameDay(weekStart, thisWeekStart.add({ weeks: 1 }))
            ? t('nextWeek')
            : t('weekOf', { date: mediumDayFormatter.format(weekStart.toDate(timeZone)) })
      : isSameDay(date, todayDate)
        ? t('today')
        : isSameDay(date, todayDate.subtract({ days: 1 }))
          ? t('yesterday')
          : isSameDay(date, todayDate.add({ days: 1 }))
            ? t('tomorrow')
            : weekdayFormatter.format(date.toDate(timeZone))
  const subtitle =
    unit !== 'day'
      ? t('weekSubtitle', {
          week: weekNumberOf(days),
          range: dayFormatter.formatRange(
            days[0].toDate(timeZone),
            days[days.length - 1].toDate(timeZone)
          )
        })
      : dayFormatter.format(date.toDate(timeZone))

  const navigate = (next: CalendarDate, nextUnit: CalendarRange): void => {
    setSearchParams({
      ...(isSameDay(next, todayDate) ? {} : { date: next.toString() }),
      ...(nextUnit !== 'day' ? { range: nextUnit } : {})
    })
  }

  useShortcut(appShortcuts.create, () => setDialog({ date: newEntryDate }))
  useCreateRequest(() => setDialog({ date: newEntryDate }))

  const runTimer = async (action: () => Promise<void>): Promise<void> => {
    setDeleteError(null)
    try {
      await action()
    } catch (caught) {
      setDeleteError(errorMessage(caught))
    }
  }

  const handleDelete = async (entryId: number): Promise<void> => {
    setDeleteError(null)
    try {
      if (running?.entry.id === entryId) await discard()
      else await api.timeEntries.delete(entryId)
    } catch (caught) {
      setDeleteError(errorMessage(caught))
    }
    setReloadCount((count) => count + 1)
  }

  const handleMove = async (
    { entry }: TimeEntryDetails,
    day: CalendarDate,
    startedAt: Date,
    endedAt: Date
  ): Promise<void> => {
    setDeleteError(null)
    try {
      await api.timeEntries.update(entry.id, {
        activityId: entry.activityId,
        date: day.toString(),
        note: entry.note,
        startedAt,
        endedAt,
        timezone: timeZone
      })
    } catch (caught) {
      setDeleteError(errorMessage(caught))
    }
    setReloadCount((count) => count + 1)
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={title}
        subtitle={subtitle}
        help={t('help')}
        helpTopic="tracking"
        actions={
          <Button onPress={() => setDialog({ date: newEntryDate })} shortcut={appShortcuts.create}>
            <RiAddLine className="size-4" />
            {t('create')}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ToggleButtonGroup
              aria-label={t('range')}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[unit]}
              onSelectionChange={(keys) => {
                const [selected] = keys
                navigate(date, parseRange(String(selected)))
              }}
            >
              {rangeOptions.map(({ id, Icon }) => (
                <TooltipTrigger key={id} delay={500}>
                  <ToggleButton id={id} variant="segment" aria-label={t(id)} className="px-2">
                    <Icon className="size-5" />
                  </ToggleButton>
                  <Tooltip>{t(id)}</Tooltip>
                </TooltipTrigger>
              ))}
            </ToggleButtonGroup>
            <DayNavigator
              date={date}
              today={todayDate}
              unit={unit}
              onChange={(next) => navigate(next, unit)}
            />
          </div>
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {t('total', { duration: formatDuration(total) })}
          </span>
        </div>
      </ViewHeader>
      {deleteError && <p className="px-8 pt-4 text-sm text-destructive">{deleteError}</p>}
      {error && <p className="p-8 text-sm text-destructive">{error}</p>}
      {!error && entries && unit !== 'day' && (
        <WeekCalendar
          days={days}
          entries={entries}
          today={todayDate}
          now={now}
          onOpenDay={(day) => navigate(day, 'day')}
          onCreate={(day, start, end) => setDialog({ date: day, start, end })}
          onEdit={(details) => setDialog({ date: parseDate(details.entry.date), details })}
          onChange={handleMove}
          onShiftWeek={(direction) => navigate(date.add({ weeks: direction }), unit)}
        />
      )}
      {!error && entries && unit === 'day' && (
        <GridList
          aria-label={title}
          items={rows}
          disabledKeys={rows.flatMap((row) => (row.kind === 'withoutTimes' ? [row.id] : []))}
          className="min-h-0 flex-1"
          renderEmptyState={() =>
            entries.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )
          }
        >
          {(row) => {
            if (row.kind === 'gap') {
              const label = t('gap', {
                duration: formatDuration(elapsedSeconds(row.start, row.end.getTime()))
              })
              return (
                <GridListItem
                  id={row.id}
                  textValue={label}
                  onAction={() =>
                    setDialog({
                      date,
                      start: toTime(fromDate(row.start, timeZone)),
                      end: toTime(fromDate(row.end, timeZone))
                    })
                  }
                  className="group h-auto"
                >
                  <span aria-hidden className="w-16 shrink-0" />
                  <span
                    aria-hidden
                    className="ml-px w-1 shrink-0 self-stretch border-l-2 border-dashed border-border"
                  />
                  <span className="py-1.5 text-xs text-muted-foreground">{label}</span>
                  <RiAddLine
                    aria-hidden
                    className="size-4 text-muted-foreground opacity-0 group-data-focus-visible:opacity-100 group-data-hovered:opacity-100"
                  />
                </GridListItem>
              )
            }

            if (row.kind === 'withoutTimes') {
              return (
                <GridListItem id={row.id} textValue={t('withoutTimes')} className="h-auto">
                  <span className="pt-4 pb-1.5 text-xs font-medium text-muted-foreground">
                    {t('withoutTimes')}
                  </span>
                </GridListItem>
              )
            }

            const { details } = row
            const { entry, activity, project, tags } = details
            const isRunning = entry.startedAt !== null && entry.endedAt === null
            const canContinue = !activity.archivedAt && !project.archivedAt
            return (
              <GridListItem
                id={entry.id}
                textValue={`${activity.name} ${project.name}`}
                className={isRunning ? 'h-auto items-start bg-primary/10' : 'h-auto items-start'}
              >
                {showsTimes && (
                  <div className="flex w-16 shrink-0 flex-col self-start py-3 tabular-nums">
                    {entry.startedAt && (
                      <>
                        <span className="font-medium">{timeFormatter.format(entry.startedAt)}</span>
                        <span className={isRunning ? 'text-primary' : 'text-muted-foreground'}>
                          {entry.endedAt ? timeFormatter.format(entry.endedAt) : t('now')}
                        </span>
                      </>
                    )}
                  </div>
                )}
                <span
                  aria-hidden
                  className="my-2 w-1 shrink-0 self-stretch rounded-full bg-muted"
                  style={project.color ? { backgroundColor: project.color } : undefined}
                />
                <div className="flex min-w-0 flex-1 flex-col py-3">
                  <span className="flex flex-wrap gap-x-2">
                    <span className="truncate font-medium" title={activity.name}>
                      {activity.name}
                    </span>
                    <span className="truncate text-muted-foreground" title={project.name}>
                      {project.name}
                    </span>
                  </span>
                  {entry.note && (
                    <ExpandableNote text={entry.note} className="text-xs text-muted-foreground" />
                  )}
                  {tags.length > 0 && <TagBadges tags={tags} className="mt-2" />}
                </div>
                <span className="w-14 py-3 text-right font-medium tabular-nums">
                  {formatDuration(durationOf(entry))}
                </span>
                {isRunning ? (
                  <Button
                    variant="icon"
                    className="mt-2.5"
                    aria-label={t('stop', { name: activity.name })}
                    onPress={() => runTimer(stop)}
                  >
                    <RiStopFill className="size-4 text-primary" />
                  </Button>
                ) : (
                  <Button
                    variant="icon"
                    className="mt-2.5"
                    aria-label={t('continue', { name: activity.name })}
                    onPress={() => runTimer(() => start(activity.id))}
                    isDisabled={!canContinue}
                  >
                    <RiPlayFill className="size-4" />
                  </Button>
                )}
                <Button
                  variant="icon"
                  className="mt-2.5"
                  aria-label={t('edit', { name: activity.name })}
                  onPress={() => setDialog({ date: parseDate(entry.date), details })}
                  isDisabled={isRunning}
                >
                  <RiPencilLine className="size-4" />
                </Button>
                <Button
                  variant="icon"
                  className="mt-2.5"
                  aria-label={t('delete', { name: activity.name })}
                  onPress={() => setEntryToDelete(details)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
                <MenuTrigger placement="bottom end">
                  <Button
                    variant="icon"
                    className="mt-2.5"
                    aria-label={t('actions', { name: activity.name })}
                  >
                    <RiMore2Line className="size-4" />
                  </Button>
                  <Menu
                    disabledKeys={isRunning ? ['move'] : []}
                    onAction={() => setEntryToMove(details)}
                  >
                    <MenuItem id="move">
                      <RiCalendarScheduleLine aria-hidden className="size-4" />
                      {t('moveEntry')}
                    </MenuItem>
                  </Menu>
                </MenuTrigger>
              </GridListItem>
            )
          }}
        </GridList>
      )}
      {dialog && (
        <TimeEntryDialog
          date={dialog.date}
          start={dialog.start}
          end={dialog.end}
          details={dialog.details}
          onClose={() => setDialog(null)}
          onSaved={() => setReloadCount((count) => count + 1)}
        />
      )}
      {entryToMove && (
        <MoveTimeEntryDialog
          details={entryToMove}
          onClose={() => setEntryToMove(null)}
          onMoved={() => setReloadCount((count) => count + 1)}
        />
      )}
      <Modal
        isOpen={entryToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setEntryToDelete(null)}
        isDismissable
      >
        {entryToDelete && (
          <AlertDialog
            variant="destructive"
            title={t('deleteConfirmTitle', { name: entryToDelete.activity.name })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() => handleDelete(entryToDelete.entry.id)}
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default TrackingView
