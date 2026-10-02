import { useEffect } from 'react'
import { RouterProvider } from 'react-aria-components'
import { Outlet, useHref, useNavigate } from 'react-router'
import { api } from '../../lib/api'
import { Sidebar } from '../organisms/Sidebar'

export function AppTemplate(): React.JSX.Element {
  const navigate = useNavigate()

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
