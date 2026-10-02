import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TimeEntryDetails } from '../../../shared/timeEntries'
import { useProfiles } from '../hooks/useProfiles'
import { api, events } from '../lib/api'
import { TimerContext } from './TimerContext'

interface TimerProviderProps {
  readonly children: React.ReactNode
}

function TimerProvider({ children }: TimerProviderProps): React.JSX.Element {
  const { activeProfile } = useProfiles()
  const path = activeProfile?.isAvailable ? activeProfile.path : null
  const [loaded, setLoaded] = useState<{
    readonly path: string
    readonly timer: TimeEntryDetails | null
  } | null>(null)
  const [revision, setRevision] = useState(0)
  const running = path !== null && loaded?.path === path ? loaded.timer : null

  useEffect(() => {
    if (path === null) return
    let isCurrent = true
    api.timer
      .get()
      .then((timer) => isCurrent && setLoaded({ path, timer }))
      .catch(() => isCurrent && setLoaded({ path, timer: null }))
    return () => {
      isCurrent = false
    }
  }, [path, revision])

  useEffect(() => events.onTimerChanged(() => setRevision((count) => count + 1)), [])

  const start = useCallback(async (activityId: number) => {
    await api.timer.start(activityId)
  }, [])

  const stop = useCallback(async () => {
    await api.timer.stop()
  }, [])

  const discard = useCallback(async () => {
    await api.timer.discard()
  }, [])

  const value = useMemo(
    () => ({ running, revision, start, stop, discard }),
    [running, revision, start, stop, discard]
  )

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export default TimerProvider
