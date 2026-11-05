import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-aria-components'
import { Outlet, useHref, useNavigate } from 'react-router'
import AboutProvider from '@/renderer/contexts/AboutProvider'
import UpdatesProvider from '@/renderer/contexts/UpdatesProvider'
import { useDonationReminder } from '@/renderer/hooks/useDonationReminder'
import { useProfiles } from '@/renderer/hooks/useProfiles'
import { useShortcut } from '@/renderer/hooks/useShortcut'
import { useTimer } from '@/renderer/hooks/useTimer'
import { api } from '@/renderer/lib/api'
import { appShortcuts } from '@/renderer/lib/shortcuts'
import { ToastRegion } from '@/renderer/components/atoms/Toast'
import { CommandPalette } from '@/renderer/components/organisms/CommandPalette'
import { Sidebar } from '@/renderer/components/organisms/Sidebar'

export function AppTemplate(): React.JSX.Element {
  const navigate = useNavigate()
  const { activeProfile } = useProfiles()
  const hasProfile = activeProfile?.isAvailable ?? false
  const { running, stop } = useTimer()
  const [isPaletteOpen, setPaletteOpen] = useState(false)
  const [paletteProfile, setPaletteProfile] = useState(activeProfile?.path)

  if (paletteProfile !== activeProfile?.path) {
    setPaletteProfile(activeProfile?.path)
    setPaletteOpen(false)
  }

  useShortcut(appShortcuts.timer, () => navigate('/timer'), hasProfile)
  useShortcut(appShortcuts.entries, () => navigate('/tracking'), hasProfile)
  useShortcut(appShortcuts.projects, () => navigate('/projects'), hasProfile)
  useShortcut(appShortcuts.clients, () => navigate('/clients'), hasProfile)
  useShortcut(appShortcuts.tags, () => navigate('/tags'), hasProfile)
  useShortcut(appShortcuts.reports, () => navigate('/reports'), hasProfile)
  useShortcut(appShortcuts.export, () => navigate('/export'), hasProfile)
  useShortcut(appShortcuts.settings, () => navigate('/settings'))
  useShortcut(appShortcuts.quickStart, () => api.quick.toggle().catch(console.error), hasProfile)
  useShortcut(appShortcuts.commandPalette, () => setPaletteOpen(true))
  useShortcut(appShortcuts.stopTimer, () => stop().catch(console.error), running !== null)
  useDonationReminder()

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
      <UpdatesProvider>
        <AboutProvider>
          <div className="flex h-screen bg-background text-foreground">
            <Sidebar onSearch={() => setPaletteOpen(true)} />
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
          <CommandPalette isOpen={isPaletteOpen} onOpenChange={setPaletteOpen} />
          <ToastRegion />
        </AboutProvider>
      </UpdatesProvider>
    </RouterProvider>
  )
}
