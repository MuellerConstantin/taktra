import { useContext } from 'react'
import { UpdatesContext, type UpdatesContextValue } from '../contexts/UpdatesContext'

export function useUpdates(): UpdatesContextValue {
  const context = useContext(UpdatesContext)

  if (!context) throw new Error('useUpdates must be used within an UpdatesProvider')

  return context
}
