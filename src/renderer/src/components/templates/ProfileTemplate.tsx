import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useProfiles } from '../../hooks/useProfiles'
import WelcomeView from '../../views/WelcomeView'

/** Lists to go back to from detail routes, whose ids mean something else in another profile. */
const listsOfDetails: Readonly<Record<string, string>> = {
  projects: '/projects',
  activities: '/projects',
  tags: '/tags'
}

function listOfDetail(pathname: string): string | null {
  const [section, entityId] = pathname.split('/').filter(Boolean)
  return entityId ? (listsOfDetails[section] ?? null) : null
}

export function ProfileTemplate(): React.JSX.Element | null {
  const { activeProfile } = useProfiles()
  const { pathname } = useLocation()
  const activePath = activeProfile?.path ?? null
  const [shown, setShown] = useState<{ path: string | null; redirect: string | null }>({
    path: activePath,
    redirect: null
  })

  if (shown.path !== activePath) {
    setShown({ path: activePath, redirect: listOfDetail(pathname) })
    return null
  }
  if (shown.redirect !== null) {
    if (shown.redirect !== pathname) return <Navigate to={shown.redirect} replace />
    setShown({ path: shown.path, redirect: null })
  }

  // Keyed by profile, so a switch also discards open dialogs and unsaved input of the old one.
  return activeProfile?.isAvailable ? <Outlet key={activePath} /> : <WelcomeView />
}
