import { RiExternalLinkLine, RiStopFill } from '@remixicon/react'
import { useTranslations } from 'use-intl'
import { Button } from '../components/atoms/Button'
import { useNow } from '../hooks/useNow'
import { useTimer } from '../hooks/useTimer'
import { api } from '../lib/api'
import { elapsedSeconds, formatElapsed } from '../lib/duration'
import { NEUTRAL_COLOR } from '../lib/report'

function MiniTimerView(): React.JSX.Element {
  const t = useTranslations('MiniTimerView')
  const { running, stop } = useTimer()
  const now = useNow(running !== null)

  return (
    <div className="mini-timer h-screen p-1 select-none [-webkit-app-region:drag]">
      {running?.entry.startedAt && (
        <div className="flex h-full items-center gap-3 rounded-xl border border-border bg-card pr-2 pl-4 text-card-foreground shadow-sm">
          <span
            aria-hidden
            className="size-2.5 shrink-0 animate-pulse rounded-full"
            style={{ backgroundColor: running.project.color ?? NEUTRAL_COLOR }}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{running.activity.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              <span className="tabular-nums">
                {formatElapsed(elapsedSeconds(running.entry.startedAt, now))}
              </span>
              {' · '}
              {running.project.name}
            </span>
          </div>
          <div className="flex items-center [-webkit-app-region:no-drag]">
            <Button variant="icon" aria-label={t('open')} onPress={() => api.app.showMainWindow()}>
              <RiExternalLinkLine className="size-4" />
            </Button>
            <Button variant="icon" aria-label={t('stop')} onPress={() => stop()}>
              <RiStopFill className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiniTimerView
