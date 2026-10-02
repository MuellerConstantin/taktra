import { useContext } from 'react'
import { ProfilesContext, type ProfilesContextValue } from '../contexts/ProfilesContext'

export function useProfiles(): ProfilesContextValue {
  const context = useContext(ProfilesContext)

  if (!context) throw new Error('useProfiles must be used within a ProfilesProvider')

  return context
}
