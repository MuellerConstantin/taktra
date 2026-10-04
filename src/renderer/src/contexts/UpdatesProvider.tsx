import { useCallback, useEffect, useMemo, useState } from 'react'
import type { UpdateStatus } from '../../../shared/updates'
import { api, events } from '../lib/api'
import { UpdatesContext } from './UpdatesContext'

interface UpdatesProviderProps {
  readonly children: React.ReactNode
}

function UpdatesProvider({ children }: UpdatesProviderProps): React.JSX.Element {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })

  useEffect(() => {
    const load = (): void => void api.updates.status().then(setStatus).catch(console.error)
    load()
    return events.onUpdatesChanged(load)
  }, [])

  const check = useCallback(() => api.updates.check(), [])
  const install = useCallback(() => api.updates.install(), [])

  const value = useMemo(() => ({ status, check, install }), [status, check, install])

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>
}

export default UpdatesProvider
