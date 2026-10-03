import {
  DateFormatter,
  getLocalTimeZone,
  isSameDay,
  parseDate,
  today,
  type CalendarDate
} from '@internationalized/date'
import { RiAddLine, RiDeleteBinLine, RiPencilLine, RiPlayFill, RiStopFill } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { TimeEntryDetails } from '../../../shared/timeEntries'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { DayNavigator } from '../components/molecules/DayNavigator'
import { TagBadges } from '../components/molecules/TagBadges'
import { TimeEntryDialog } from '../components/molecules/TimeEntryDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useNow } from '../hooks/useNow'
import { useProfiles } from '../hooks/useProfiles'
import { useShortcut } from '../hooks/useShortcut'
import { useTimer } from '../hooks/useTimer'
import { api } from '../lib/api'
import { elapsedSeconds, formatDuration } from '../lib/duration'
import { appShortcuts } from '../lib/shortcuts'

function parseDay(value: string | null, fallback: CalendarDate): CalendarDate {
  if (!value) return fallback
  try {
    return parseDate(value)
  } catch {
    return fallback
  }
}

function TrackingView(): React.JSX.Element {
  const t = useTranslations('TrackingView')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
  const [searchParams, setSearchParams] = useSearchParams()
  const todayDate = today(getLocalTimeZone())
  const date = parseDay(searchParams.get('date'), todayDate)
  const day = date.toString()
  const [entries, setEntries] = useState<readonly TimeEntryDetails[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ readonly details?: TimeEntryDetails } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [entryToDelete, setEntryToDelete] = useState<TimeEntryDetails | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { running, revision, start, stop, discard } = useTimer()
  const isRunningShown =
    running !== null && (entries ?? []).some(({ entry }) => entry.id === running.entry.id)
  const now = useNow(isRunningShown)
  const durationOf = ({ startedAt, endedAt, durationSec }: TimeEntryDetails['entry']): number =>
    startedAt && !endedAt ? elapsedSeconds(startedAt, now) : (durationSec ?? 0)

  const dayFormatter = new DateFormatter(locale, { dateStyle: 'long' })
  const weekdayFormatter = new DateFormatter(locale, { weekday: 'long' })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })
  const total = (entries ?? []).reduce((sum, { entry }) => sum + durationOf(entry), 0)

  useEffect(() => {
    let isCurrent = true
    api.timeEntries
      .list({ from: day, to: day })
      .then((result) => {
        if (!isCurrent) return
        setEntries(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, day, reloadCount, revision, errorMessage])

  const title = isSameDay(date, todayDate)
    ? t('today')
    : isSameDay(date, todayDate.subtract({ days: 1 }))
      ? t('yesterday')
      : isSameDay(date, todayDate.add({ days: 1 }))
        ? t('tomorrow')
        : weekdayFormatter.format(date.toDate(getLocalTimeZone()))

  const changeDay = (next: CalendarDate): void => {
    setSearchParams(isSameDay(next, todayDate) ? {} : { date: next.toString() })
  }

  useShortcut(appShortcuts.create, () => setDialog({}))

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

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={title}
        subtitle={dayFormatter.format(date.toDate(getLocalTimeZone()))}
        actions={
          <Button onPress={() => setDialog({})} shortcut={appShortcuts.create}>
            <RiAddLine className="size-4" />
            {t('create')}
          </Button>
        }
      >
        <div className="flex items-center justify-between gap-4 pb-4">
          <DayNavigator date={date} today={todayDate} onChange={changeDay} />
          <span className="text-sm text-muted-foreground">
            {t('total', { duration: formatDuration(total) })}
          </span>
        </div>
      </ViewHeader>
      {deleteError && <p className="px-8 pt-4 text-sm text-destructive">{deleteError}</p>}
      {error && <p className="p-8 text-sm text-destructive">{error}</p>}
      {!error && entries && (
        <GridList
          aria-label={title}
          items={entries}
          className="min-h-0 flex-1"
          renderEmptyState={() =>
            entries.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )
          }
        >
          {(details) => {
            const { entry, activity, project, tags } = details
            const isRunning = entry.startedAt !== null && entry.endedAt === null
            const canContinue = !activity.archivedAt && !project.archivedAt
            return (
              <GridListItem
                id={entry.id}
                textValue={`${activity.name} ${project.name}`}
                className="h-auto"
              >
                <span
                  aria-hidden
                  className="mt-4 size-3 shrink-0 self-start rounded-full bg-muted"
                  style={project.color ? { backgroundColor: project.color } : undefined}
                />
                <div className="flex min-w-0 flex-1 flex-col py-3">
                  <span className="truncate">
                    <span className="font-medium">{activity.name}</span>
                    <span className="text-muted-foreground"> · {project.name}</span>
                  </span>
                  {entry.note && (
                    <span className="line-clamp-2 text-xs whitespace-pre-line text-muted-foreground">
                      {entry.note}
                    </span>
                  )}
                  {tags.length > 0 && <TagBadges tags={tags} className="mt-2" />}
                </div>
                {entry.startedAt && entry.endedAt && (
                  <span className="text-muted-foreground tabular-nums">
                    {timeFormatter.formatRange(entry.startedAt, entry.endedAt)}
                  </span>
                )}
                {entry.startedAt && !entry.endedAt && (
                  <span className="text-muted-foreground tabular-nums">
                    {t('runningSince', { time: timeFormatter.format(entry.startedAt) })}
                  </span>
                )}
                <span className="w-14 text-right font-medium tabular-nums">
                  {formatDuration(durationOf(entry))}
                </span>
                {isRunning ? (
                  <Button
                    variant="icon"
                    aria-label={t('stop', { name: activity.name })}
                    onPress={() => runTimer(stop)}
                  >
                    <RiStopFill className="size-4 text-primary" />
                  </Button>
                ) : (
                  <Button
                    variant="icon"
                    aria-label={t('continue', { name: activity.name })}
                    onPress={() => runTimer(() => start(activity.id))}
                    isDisabled={!canContinue}
                  >
                    <RiPlayFill className="size-4" />
                  </Button>
                )}
                <Button
                  variant="icon"
                  aria-label={t('edit', { name: activity.name })}
                  onPress={() => setDialog({ details })}
                  isDisabled={isRunning}
                >
                  <RiPencilLine className="size-4" />
                </Button>
                <Button
                  variant="icon"
                  aria-label={t('delete', { name: activity.name })}
                  onPress={() => setEntryToDelete(details)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              </GridListItem>
            )
          }}
        </GridList>
      )}
      {dialog && (
        <TimeEntryDialog
          date={date}
          details={dialog.details}
          onClose={() => setDialog(null)}
          onSaved={() => setReloadCount((count) => count + 1)}
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
