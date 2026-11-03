import { useEffect, useState } from 'react'
import { events } from '../lib/api'
import { DataRevisionContext } from './DataRevisionContext'

interface DataRevisionProviderProps {
  readonly children: React.ReactNode
}

function DataRevisionProvider({ children }: DataRevisionProviderProps): React.JSX.Element {
  const [revision, setRevision] = useState(0)

  useEffect(() => events.onDataChanged(() => setRevision((count) => count + 1)), [])

  return <DataRevisionContext.Provider value={revision}>{children}</DataRevisionContext.Provider>
}

export default DataRevisionProvider
