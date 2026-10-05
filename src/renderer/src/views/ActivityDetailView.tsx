import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import {
  RiArchiveLine,
  RiArrowRightSLine,
  RiBuilding2Line,
  RiDeleteBinLine,
  RiFolderTransferLine,
  RiInboxUnarchiveLine,
  RiPencilLine,
  RiPlayFill,
  RiStopFill
} from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocale } from 'react-aria-components'
import { useNavigate, useParams } from 'react-router'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../shared/activities'
import { isAppError } from '../../../shared/errors'
import type { ActivityDetails, TimeEntryDetails } from '../../../shared/timeEntries'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { ActivityDialog } from '../components/molecules/ActivityDialog'
import { MoveActivityDialog } from '../components/molecules/MoveActivityDialog'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { TagBadges } from '../components/molecules/TagBadges'
import { TimeEntryDialog } from '../components/molecules/TimeEntryDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useNow } from '../hooks/useNow'
import { useTimer } from '../hooks/useTimer'
import { api } from '../lib/api'
import { elapsedSeconds, formatDuration } from '../lib/duration'
import { allTime, periodFilter, type Period } from '../lib/period'

const breadcrumbLinkClassName =
  'cursor-default rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'

function ActivityDetailView(): React.JSX.Element {
  const t = useTranslations('ActivityDetailView')
  const errorMessage = useErrorMessage()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const activityId = Number(useParams().activityId)
  const [details, setDetails] = useState<ActivityDetails | null>(null)
  const [entries, setEntries] = useState<readonly TimeEntryDetails[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [dialog, setDialog] = useState<'edit' | 'move' | null>(null)
  const [entryToEdit, setEntryToEdit] = useState<TimeEntryDetails | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<TimeEntryDetails | null>(null)
  const [period, setPeriod] = useState<Period>(allTime)
  const { from, to } = periodFilter(period)
  const { running, revision, start, stop, discard } = useTimer()
  const lastProjectId = useRef<number | null>(null)

  const isRunning = running !== null && running.activity.id === activityId
  const now = useNow(isRunning)
  const durationOf = ({ startedAt, endedAt, durationSec }: TimeEntryDetails['entry']): number =>
    startedAt && !endedAt ? elapsedSeconds(startedAt, now) : (durationSec ?? 0)
  const total = (entries ?? []).reduce((sum, { entry }) => sum + durationOf(entry), 0)
  const rows = [...(entries ?? [])].reverse().map((row) => ({ id: row.entry.id, ...row }))

  const dateFormatter = new DateFormatter(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })
  const formatDate = (date: string): string =>
    dateFormatter.format(parseDate(date).toDate(getLocalTimeZone()))

  const reload = (): void => setReloadCount((count) => count + 1)

  useEffect(() => {
    let isCurrent = true
    Promise.all([api.activities.get(activityId), api.timeEntries.list({ activityId, from, to })])
      .then(([loadedDetails, loadedEntries]) => {
        if (!isCurrent) return
        lastProjectId.current = loadedDetails.project.id
        setDetails(loadedDetails)
        setEntries(loadedEntries)
        setError(null)
      })
      .catch((caught) => {
        if (!isCurrent) return
        if (isAppError(caught, 'ACTIVITY_NOT_FOUND') && lastProjectId.current !== null) {
          navigate(`/projects/${lastProjectId.current}`, { replace: true })
          return
        }
        setError(errorMessage(caught))
      })
    return () => {
      isCurrent = false
    }
  }, [activityId, from, to, reloadCount, revision, navigate, errorMessage])

  const runAction = async (action: () => Promise<unknown>): Promise<void> => {
    setActionError(null)
    try {
      await action()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
    reload()
  }

  if (error) return <p className="p-8 text-sm text-destructive">{error}</p>
  if (!details || !entries) return <div />

  const { activity, project, client, tags } = details
  const activityRef: ActivityRef = {
    id: activity.id,
    projectId: project.id,
    name: activity.name,
    tags
  }
  const canStart = !activity.archivedAt && !project.archivedAt

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={
          <span className="line-clamp-2 break-words" title={activity.name}>
            {activity.name}
          </span>
        }
        subtitle={
          <span className="flex min-w-0 items-center gap-1">
            <Link href="/projects" className={breadcrumbLinkClassName}>
              {t('projects')}
            </Link>
            <RiArrowRightSLine aria-hidden className="size-3.5 shrink-0" />
            <Link
              href={`/projects/${project.id}`}
              className={`flex min-w-0 items-center gap-1.5 ${breadcrumbLinkClassName}`}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full bg-muted"
                style={project.color ? { backgroundColor: project.color } : undefined}
              />
              <span className="truncate">{project.name}</span>
            </Link>
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onPress={() =>
                runAction(() => api.activities.setArchived(activity.id, !activity.archivedAt))
              }
            >
              {activity.archivedAt ? (
                <RiInboxUnarchiveLine className="size-4" />
              ) : (
                <RiArchiveLine className="size-4" />
              )}
              {activity.archivedAt ? t('unarchive') : t('archive')}
            </Button>
            <Button variant="secondary" onPress={() => setDialog('move')}>
              <RiFolderTransferLine className="size-4" />
              {t('move')}
            </Button>
            <Button variant="secondary" onPress={() => setDialog('edit')}>
              <RiPencilLine className="size-4" />
              {t('edit')}
            </Button>
            {isRunning ? (
              <Button onPress={() => runAction(stop)}>
                <RiStopFill className="size-4" />
                {t('stop')}
              </Button>
            ) : (
              <Button onPress={() => runAction(() => start(activity.id))} isDisabled={!canStart}>
                <RiPlayFill className="size-4" />
                {t('start')}
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4">
          <div className="flex min-w-0 flex-1 basis-40 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {activity.archivedAt && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                {t('archived')}
              </span>
            )}
            {client && (
              <span className="flex min-w-0 items-center gap-1.5" title={t('client')}>
                <RiBuilding2Line aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{client.name}</span>
              </span>
            )}
            {tags.length > 0 && <TagBadges tags={tags} />}
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {t('total', { duration: formatDuration(total) })}
          </span>
          <PeriodPicker value={period} onChange={setPeriod} className="ml-auto" />
        </div>
      </ViewHeader>
      {actionError && <p className="px-8 pt-4 text-sm text-destructive">{actionError}</p>}
      <GridList
        aria-label={t('entries')}
        items={rows}
        className="min-h-0 flex-1"
        renderEmptyState={() => (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {period.range ? t('emptyPeriod') : t('empty')}
          </p>
        )}
      >
        {(row) => {
          const { entry } = row
          const date = formatDate(entry.date)
          const isEntryRunning = entry.startedAt !== null && entry.endedAt === null
          return (
            <GridListItem
              textValue={date}
              className={isEntryRunning ? 'h-auto bg-primary/10' : 'h-auto'}
            >
              <div className="flex w-36 shrink-0 flex-col self-start py-3 tabular-nums">
                <span className="font-medium">{date}</span>
                {entry.startedAt && (
                  <span className={isEntryRunning ? 'text-primary' : 'text-muted-foreground'}>
                    {timeFormatter.format(entry.startedAt)} –{' '}
                    {entry.endedAt ? timeFormatter.format(entry.endedAt) : t('now')}
                  </span>
                )}
              </div>
              <span className="line-clamp-2 min-w-0 flex-1 py-3 whitespace-pre-line text-muted-foreground">
                {entry.note}
              </span>
              <span className="w-14 text-right font-medium tabular-nums">
                {formatDuration(durationOf(entry))}
              </span>
              <Button
                variant="icon"
                aria-label={t('editEntry', { date })}
                onPress={() => setEntryToEdit(row)}
                isDisabled={isEntryRunning}
              >
                <RiPencilLine className="size-4" />
              </Button>
              <Button
                variant="icon"
                aria-label={t('deleteEntry', { date })}
                onPress={() => setEntryToDelete(row)}
              >
                <RiDeleteBinLine className="size-4" />
              </Button>
            </GridListItem>
          )
        }}
      </GridList>
      {dialog === 'edit' && (
        <ActivityDialog activity={activityRef} onClose={() => setDialog(null)} onSaved={reload} />
      )}
      {dialog === 'move' && (
        <MoveActivityDialog
          activity={activityRef}
          onClose={() => setDialog(null)}
          onMoved={reload}
        />
      )}
      {entryToEdit && (
        <TimeEntryDialog
          date={parseDate(entryToEdit.entry.date)}
          details={entryToEdit}
          onClose={() => setEntryToEdit(null)}
          onSaved={reload}
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
            title={t('deleteConfirmTitle', { date: formatDate(entryToDelete.entry.date) })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() =>
              runAction(() =>
                running?.entry.id === entryToDelete.entry.id
                  ? discard()
                  : api.timeEntries.delete(entryToDelete.entry.id)
              )
            }
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default ActivityDetailView
