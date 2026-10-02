import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProfilesState } from '../../../shared/profiles'
import { api } from '../lib/api'
import { ProfilesContext } from './ProfilesContext'

interface ProfilesProviderProps {
  readonly children: React.ReactNode
}

function ProfilesProvider({ children }: ProfilesProviderProps): React.JSX.Element | null {
  const [state, setState] = useState<ProfilesState | null>(null)

  useEffect(() => {
    api.profiles.get().then(setState)
  }, [])

  const createProfile = useCallback(async (name: string, path: string) => {
    setState(await api.profiles.create(name, path))
  }, [])

  const setActiveProfile = useCallback(async (path: string) => {
    setState(await api.profiles.setActive(path))
  }, [])

  const renameProfile = useCallback(async (path: string, name: string) => {
    setState(await api.profiles.rename(path, name))
  }, [])

  const deleteProfile = useCallback(async (path: string) => {
    setState(await api.profiles.delete(path))
  }, [])

  const removeProfile = useCallback(async (path: string) => {
    setState(await api.profiles.remove(path))
  }, [])

  const openProfile = useCallback(async () => {
    const result = await api.profiles.open()
    if (result) setState(result)
  }, [])

  const value = useMemo(
    () =>
      state && {
        profiles: state.profiles,
        activeProfile: state.profiles.find((profile) => profile.path === state.activePath) ?? null,
        createProfile,
        setActiveProfile,
        renameProfile,
        deleteProfile,
        removeProfile,
        openProfile
      },
    [
      state,
      createProfile,
      setActiveProfile,
      renameProfile,
      deleteProfile,
      removeProfile,
      openProfile
    ]
  )

  if (!value) return null

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>
}

export default ProfilesProvider
