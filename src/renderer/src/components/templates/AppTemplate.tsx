import { RouterProvider } from 'react-aria-components'
import { Outlet, useHref, useNavigate } from 'react-router'
import { Sidebar } from '../organisms/Sidebar'

export function AppTemplate(): React.JSX.Element {
  const navigate = useNavigate()

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
