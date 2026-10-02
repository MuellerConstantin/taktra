import { createContext } from 'react'
import type { OpenProfileResult, ProfileSummary } from '../../../shared/profiles'

export interface ProfilesContextValue {
  readonly profiles: readonly ProfileSummary[]
  readonly activeProfile: ProfileSummary | null
  readonly createProfile: (name: string, path: string) => Promise<void>
  readonly setActiveProfile: (path: string) => Promise<void>
  readonly renameProfile: (path: string, name: string) => Promise<void>
  readonly deleteProfile: (path: string) => Promise<void>
  readonly removeProfile: (path: string) => Promise<void>
  readonly openProfile: () => Promise<OpenProfileResult['status']>
}

export const ProfilesContext = createContext<ProfilesContextValue | null>(null)
