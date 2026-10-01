import { createHashRouter, Navigate } from 'react-router'
import AppLayout from './layouts/AppLayout'
import TrackingView from './views/TrackingView'
import ProjectsView from './views/ProjectsView'
import TagsView from './views/TagsView'
import ReportsView from './views/ReportsView'
import SettingsView from './views/SettingsView'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tracking" replace /> },
      { path: 'tracking', element: <TrackingView /> },
      { path: 'projects', element: <ProjectsView /> },
      { path: 'tags', element: <TagsView /> },
      { path: 'reports', element: <ReportsView /> },
      { path: 'settings', element: <SettingsView /> }
    ]
  }
])
