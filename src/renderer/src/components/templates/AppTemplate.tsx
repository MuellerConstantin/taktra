import { useEffect } from 'react'
import { RouterProvider } from 'react-aria-components'
import { Outlet, useHref, useNavigate } from 'react-router'
import { useProfiles } from '../../hooks/useProfiles'
import { useShortcut } from '../../hooks/useShortcut'
import { useTimer } from '../../hooks/useTimer'
import { api } from '../../lib/api'
import { appShortcuts } from '../../lib/shortcuts'
import { Sidebar } from '../organisms/Sidebar'

export function AppTemplate(): React.JSX.Element {
  const navigate = useNavigate()
  const { activeProfile } = useProfiles()
  const hasProfile = activeProfile?.isAvailable ?? false
  const { running, stop } = useTimer()

  useShortcut(appShortcuts.timer, () => navigate('/timer'), hasProfile)
  useShortcut(appShortcuts.entries, () => navigate('/tracking'), hasProfile)
  useShortcut(appShortcuts.projects, () => navigate('/projects'), hasProfile)
  useShortcut(appShortcuts.tags, () => navigate('/tags'), hasProfile)
  useShortcut(appShortcuts.reports, () => navigate('/reports'), hasProfile)
  useShortcut(appShortcuts.settings, () => navigate('/settings'))
  useShortcut(appShortcuts.quickStart, () => api.quick.toggle().catch(console.error), hasProfile)
  useShortcut(appShortcuts.stopTimer, () => stop().catch(console.error), running !== null)

  useEffect(() => {
    const report = (): void => {
      api.app.setMainVisible(document.visibilityState === 'visible').catch(console.error)
    }
    report()
    document.addEventListener('visibilitychange', report)
    return () => document.removeEventListener('visibilitychange', report)
  }, [])

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </RouterProvider>
  )
}
