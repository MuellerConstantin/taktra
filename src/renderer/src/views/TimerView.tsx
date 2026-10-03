import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { RiArrowLeftRightLine, RiPlayFill, RiStopFill } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityDetails } from '../../../shared/timeEntries'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { StartTimerDialog } from '../components/molecules/StartTimerDialog'
import { TagBadges } from '../components/molecules/TagBadges'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useNow } from '../hooks/useNow'
import { useProfiles } from '../hooks/useProfiles'
import { useTimer } from '../hooks/useTimer'
import { api } from '../lib/api'
import { elapsedSeconds, formatDuration, formatElapsed } from '../lib/duration'
import { NEUTRAL_COLOR } from '../lib/report'
import { appShortcuts } from '../lib/shortcuts'

const RECENT_LIMIT = 8

function TimerView(): React.JSX.Element {
  const t = useTranslations('TimerView')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
  const { running, revision, start, stop, discard } = useTimer()
  const now = useNow(running !== null)
  const [recent, setRecent] = useState<readonly ActivityDetails[] | null>(null)
  const [bookedTodaySec, setBookedTodaySec] = useState(0)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [isDiscardOpen, setDiscardOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const todayDate = today(getLocalTimeZone())
  const day = todayDate.toString()
  const dayFormatter = new DateFormatter(locale, { dateStyle: 'long' })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })
  const runningSec = running?.entry.startedAt ? elapsedSeconds(running.entry.startedAt, now) : 0
  const runningToday = running?.entry.date === day ? runningSec : 0

  useEffect(() => {
    let isCurrent = true
    Promise.all([api.timer.recent(RECENT_LIMIT), api.timeEntries.list({ from: day, to: day })])
      .then(([activities, entries]) => {
        if (!isCurrent) return
        setRecent(activities)
        setBookedTodaySec(entries.reduce((sum, { entry }) => sum + (entry.durationSec ?? 0), 0))
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, revision, day, errorMessage])

  const run = async (action: () => Promise<void>): Promise<void> => {
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        subtitle={dayFormatter.format(todayDate.toDate(getLocalTimeZone()))}
        actions={
          running && (
            <Button variant="secondary" onPress={() => setDialogOpen(true)}>
              <RiArrowLeftRightLine className="size-4" />
              {t('switch')}
            </Button>
          )
        }
      >
        <div className="flex justify-end pb-4">
          <span className="text-sm text-muted-foreground">
            {t('todayTotal', { duration: formatDuration(bookedTodaySec + runningToday) })}
          </span>
        </div>
      </ViewHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-8 py-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-8 text-center">
          {running?.entry.startedAt ? (
            <>
              <span className="text-5xl font-semibold tracking-tight tabular-nums">
                {formatElapsed(runningSec)}
              </span>
              <div className="flex max-w-full flex-col items-center gap-2">
                <span className="flex max-w-full items-center gap-2">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 animate-pulse rounded-full"
                    style={{ backgroundColor: running.project.color ?? NEUTRAL_COLOR }}
                  />
                  <span className="truncate">
                    <span className="font-medium">{running.activity.name}</span>
                    <span className="text-muted-foreground"> · {running.project.name}</span>
                  </span>
                </span>
                {running.tags.length > 0 && <TagBadges tags={running.tags} />}
                <span className="text-xs text-muted-foreground">
                  {t('since', { time: timeFormatter.format(running.entry.startedAt) })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button onPress={() => run(stop)} shortcut={appShortcuts.stopTimer}>
                  <RiStopFill className="size-4" />
                  {t('stop')}
                </Button>
                <Button variant="secondary" onPress={() => setDiscardOpen(true)}>
                  {t('discard')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-5xl font-semibold tracking-tight text-muted-foreground tabular-nums">
                {formatElapsed(0)}
              </span>
              <span className="text-sm text-muted-foreground">{t('idle')}</span>
              <Button onPress={() => setDialogOpen(true)}>
                <RiPlayFill className="size-4" />
                {t('start')}
              </Button>
            </>
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t('recent')}</h2>
          {recent && recent.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('recentEmpty')}</p>
          )}
          {recent && recent.length > 0 && (
            <GridList
              aria-label={t('recent')}
              items={recent.map((item) => ({ ...item, id: item.activity.id }))}
              className="rounded-xl border border-border bg-card"
            >
              {({ activity, project, tags }) => {
                const isRunning = running?.activity.id === activity.id
                return (
                  <GridListItem textValue={`${activity.name} ${project.name}`} className="h-auto">
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color ?? NEUTRAL_COLOR }}
                    />
                    <div className="flex min-w-0 flex-1 flex-col py-3">
                      <span className="truncate">
                        <span className="font-medium">{activity.name}</span>
                        <span className="text-muted-foreground"> · {project.name}</span>
                      </span>
                      {tags.length > 0 && <TagBadges tags={tags} className="mt-2" />}
                    </div>
                    {isRunning ? (
                      <Button
                        variant="icon"
                        aria-label={t('stopActivity', { name: activity.name })}
                        onPress={() => run(stop)}
                      >
                        <RiStopFill className="size-5 text-primary" />
                      </Button>
                    ) : (
                      <Button
                        variant="icon"
                        aria-label={t('startActivity', { name: activity.name })}
                        onPress={() => run(() => start(activity.id))}
                      >
                        <RiPlayFill className="size-5" />
                      </Button>
                    )}
                  </GridListItem>
                )
              }}
            </GridList>
          )}
        </section>
      </div>
      {isDialogOpen && <StartTimerDialog onClose={() => setDialogOpen(false)} />}
      <Modal isOpen={isDiscardOpen} onOpenChange={setDiscardOpen} isDismissable>
        <AlertDialog
          variant="destructive"
          title={t('discardConfirmTitle')}
          actionLabel={t('discardConfirmAction')}
          cancelLabel={t('cancel')}
          onAction={() => run(discard)}
        >
          {t('discardConfirmText')}
        </AlertDialog>
      </Modal>
    </div>
  )
}

export default TimerView
