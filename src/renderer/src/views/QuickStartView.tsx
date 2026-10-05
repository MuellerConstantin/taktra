import { RiSearchLine, RiStopFill } from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import {
  Autocomplete,
  Input,
  ListBox,
  ListBoxItem,
  SearchField,
  useFilter
} from 'react-aria-components'
import { tv } from 'tailwind-variants'
import { useTranslations } from 'use-intl'
import type { ActivityDetails } from '../../../shared/timeEntries'
import { Button } from '../components/atoms/Button'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useNow } from '../hooks/useNow'
import { useTimer } from '../hooks/useTimer'
import { api, events } from '../lib/api'
import { elapsedSeconds, formatElapsed } from '../lib/duration'
import { NEUTRAL_COLOR } from '../lib/report'

const RECENT_LIMIT = 8

const itemStyles = tv({
  base: 'flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none',
  variants: {
    isFocused: { true: 'bg-accent text-accent-foreground' }
  }
})

interface Option extends ActivityDetails {
  readonly id: number
}

function toOption(details: ActivityDetails): Option {
  return { ...details, id: details.activity.id }
}

function QuickStartView(): React.JSX.Element {
  const t = useTranslations('QuickStartView')
  const errorMessage = useErrorMessage()
  const { contains } = useFilter({ sensitivity: 'base' })
  const { running, revision, start, stop } = useTimer()
  const now = useNow(running !== null)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<readonly Option[]>([])
  const [all, setAll] = useState<readonly Option[]>([])
  const [shownCount, setShownCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(
    () =>
      events.onQuickShown(() => {
        setQuery('')
        setError(null)
        setShownCount((count) => count + 1)
        inputRef.current?.focus()
      }),
    []
  )

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.timer.recent(RECENT_LIMIT),
      api.activities.list(),
      api.projects.list(),
      api.clients.list({ includeArchived: true })
    ])
      .then(([recentActivities, activities, projects, clients]) => {
        if (!isCurrent) return
        const projectById = new Map(projects.map((project) => [project.id, project]))
        const clientById = new Map(clients.map((client) => [client.id, client]))
        setRecent(recentActivities.map(toOption))
        setAll(
          activities.flatMap((activity) => {
            const project = projectById.get(activity.projectId)
            if (!project) return []
            const clientId = project.clientId ?? activity.clientId
            const client = clientId === null ? null : (clientById.get(clientId) ?? null)
            return [toOption({ activity, project, client, tags: [] })]
          })
        )
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [shownCount, revision, errorMessage])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(() => {
      api.quick.resize(root.getBoundingClientRect().height).catch(console.error)
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const run = async (action: () => Promise<void>, close: boolean): Promise<void> => {
    setError(null)
    try {
      await action()
      if (close) await api.quick.hide()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key !== 'Escape' || query) return
    event.preventDefault()
    api.quick.hide().catch(console.error)
  }

  const options = query ? all : recent

  return (
    <div ref={rootRef} className="transparent-window p-3" onKeyDownCapture={handleKeyDown}>
      <div className="overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
        <Autocomplete
          inputValue={query}
          onInputChange={setQuery}
          filter={(textValue, inputValue) => contains(textValue, inputValue)}
        >
          <SearchField aria-label={t('search')} autoFocus className="flex items-center gap-3 px-4">
            <RiSearchLine aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={t('placeholder')}
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
          </SearchField>
          {running?.entry.startedAt && (
            <div className="flex items-center gap-3 border-t border-border px-4 py-2.5 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 animate-pulse rounded-full"
                style={{ backgroundColor: running.project.color ?? NEUTRAL_COLOR }}
              />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{running.activity.name}</span>
                <span className="text-muted-foreground">
                  {' · '}
                  {running.project.name}
                  {running.client && ` · ${running.client.name}`}
                </span>
              </span>
              <span className="text-muted-foreground tabular-nums">
                {formatElapsed(elapsedSeconds(running.entry.startedAt, now))}
              </span>
              <Button
                variant="icon"
                tooltip={false}
                aria-label={t('stop')}
                onPress={() => run(stop, false)}
              >
                <RiStopFill className="size-4 text-primary" />
              </Button>
            </div>
          )}
          <div className="border-t border-border p-2">
            <p className="px-3 pt-1 pb-2 text-xs font-medium text-muted-foreground">
              {query ? t('activities') : t('recent')}
            </p>
            <ListBox
              aria-label={query ? t('activities') : t('recent')}
              items={options}
              className="max-h-80 overflow-y-auto outline-none"
              onAction={(key) => run(() => start(Number(key)), true)}
              renderEmptyState={() => (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {query ? t('noMatch') : t('noRecent')}
                </p>
              )}
            >
              {({ activity, project, client }) => (
                <ListBoxItem
                  textValue={`${activity.name} ${project.name} ${client?.name ?? ''}`}
                  className={itemStyles}
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color ?? NEUTRAL_COLOR }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{activity.name}</span>
                    <span className="text-muted-foreground">
                      {' · '}
                      {project.name}
                      {client && ` · ${client.name}`}
                    </span>
                  </span>
                </ListBoxItem>
              )}
            </ListBox>
          </div>
          {error && (
            <p className="border-t border-border px-4 py-2 text-sm text-destructive">{error}</p>
          )}
        </Autocomplete>
      </div>
    </div>
  )
}

export default QuickStartView
