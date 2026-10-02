import { RiStopFill } from '@remixicon/react'
import { useState } from 'react'
import { Link } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { useNow } from '../../hooks/useNow'
import { useTimer } from '../../hooks/useTimer'
import { elapsedSeconds, formatElapsed } from '../../lib/duration'
import { NEUTRAL_COLOR } from '../../lib/report'
import { Button } from '../atoms/Button'

export function TimerIndicator(): React.JSX.Element | null {
  const t = useTranslations('TimerIndicator')
  const errorMessage = useErrorMessage()
  const { running, stop } = useTimer()
  const now = useNow(running !== null)
  const [error, setError] = useState<string | null>(null)

  if (!running?.entry.startedAt) return null
  const { activity, project } = running

  const handleStop = async (): Promise<void> => {
    setError(null)
    try {
      await stop()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-card py-2 pr-2 pl-3">
        <Link
          href="/timer"
          aria-label={t('open', { name: activity.name })}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 animate-pulse rounded-full"
            style={{ backgroundColor: project.color ?? NEUTRAL_COLOR }}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{activity.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatElapsed(elapsedSeconds(running.entry.startedAt, now))}
            </span>
          </span>
        </Link>
        <Button variant="icon" aria-label={t('stop')} onPress={handleStop}>
          <RiStopFill className="size-4" />
        </Button>
      </div>
      {error && <p className="px-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
