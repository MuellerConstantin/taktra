import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { RiAddLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { TimeEntryDetails } from '../../../shared/timeEntries'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { TimeEntryDialog } from '../components/molecules/TimeEntryDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { formatDuration } from '../lib/duration'

function TrackingView(): React.JSX.Element {
  const t = useTranslations('TrackingView')
  const errorMessage = useErrorMessage()
  const { locale } = useLocale()
  const { activeProfile } = useProfiles()
  const [date] = useState(() => today(getLocalTimeZone()))
  const [entries, setEntries] = useState<readonly TimeEntryDetails[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  const dayFormatter = new DateFormatter(locale, { dateStyle: 'full' })
  const timeFormatter = new DateFormatter(locale, { timeStyle: 'short' })
  const total = (entries ?? []).reduce((sum, { entry }) => sum + (entry.durationSec ?? 0), 0)

  useEffect(() => {
    let isCurrent = true
    api.timeEntries
      .list({ from: date.toString(), to: date.toString() })
      .then((result) => {
        if (!isCurrent) return
        setEntries(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, date, reloadCount, errorMessage])

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        subtitle={dayFormatter.format(date.toDate(getLocalTimeZone()))}
        actions={
          <>
            <span className="text-sm text-muted-foreground">
              {t('total', { duration: formatDuration(total) })}
            </span>
            <Button onPress={() => setDialogOpen(true)}>
              <RiAddLine className="size-4" />
              {t('create')}
            </Button>
          </>
        }
      />
      {error && <p className="p-8 text-sm text-destructive">{error}</p>}
      {!error && entries && (
        <GridList
          aria-label={t('title')}
          items={entries}
          className="min-h-0 flex-1"
          renderEmptyState={() =>
            entries.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )
          }
        >
          {({ entry, activity, project }) => (
            <GridListItem
              id={entry.id}
              textValue={`${activity.name} ${project.name}`}
              className="h-auto"
            >
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full bg-muted"
                style={project.color ? { backgroundColor: project.color } : undefined}
              />
              <div className="flex min-w-0 flex-1 flex-col py-3">
                <span className="truncate">
                  <span className="font-medium">{activity.name}</span>
                  <span className="text-muted-foreground"> · {project.name}</span>
                </span>
                {entry.note && (
                  <span className="truncate text-xs text-muted-foreground">{entry.note}</span>
                )}
              </div>
              {entry.startedAt && entry.endedAt && (
                <span className="text-muted-foreground tabular-nums">
                  {timeFormatter.formatRange(entry.startedAt, entry.endedAt)}
                </span>
              )}
              <span className="w-14 text-right font-medium tabular-nums">
                {formatDuration(entry.durationSec ?? 0)}
              </span>
            </GridListItem>
          )}
        </GridList>
      )}
      {isDialogOpen && (
        <TimeEntryDialog
          date={date}
          onClose={() => setDialogOpen(false)}
          onSaved={() => setReloadCount((count) => count + 1)}
        />
      )}
    </div>
  )
}

export default TrackingView
