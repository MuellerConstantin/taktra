import { useContext } from 'react'
import { DataRevisionContext } from '../contexts/DataRevisionContext'

export function useDataRevision(): number {
  const revision = useContext(DataRevisionContext)

  if (revision === null)
    throw new Error('useDataRevision must be used within a DataRevisionProvider')

  return revision
}
