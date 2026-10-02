import { createContext } from 'react'
import type { ProfileSummary } from '../../../shared/profiles'

export interface ProfilesContextValue {
  readonly profiles: readonly ProfileSummary[]
  readonly activeProfile: ProfileSummary | null
  readonly createProfile: (name: string, path: string) => Promise<void>
  readonly setActiveProfile: (path: string) => Promise<void>
}

export const ProfilesContext = createContext<ProfilesContextValue | null>(null)
