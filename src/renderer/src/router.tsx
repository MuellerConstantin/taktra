import { createHashRouter, Navigate } from 'react-router'
import { AppTemplate } from './components/templates/AppTemplate'
import TrackingView from './views/TrackingView'
import ProjectsView from './views/ProjectsView'
import TagsView from './views/TagsView'
import ReportsView from './views/ReportsView'
import SettingsView from './views/settings/SettingsView'
import AppearanceSettings from './views/settings/AppearanceSettings'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppTemplate />,
    children: [
      { index: true, element: <Navigate to="/tracking" replace /> },
      { path: 'tracking', element: <TrackingView /> },
      { path: 'projects', element: <ProjectsView /> },
      { path: 'tags', element: <TagsView /> },
      { path: 'reports', element: <ReportsView /> },
      {
        path: 'settings',
        element: <SettingsView />,
        children: [
          { index: true, element: <Navigate to="appearance" replace /> },
          { path: 'appearance', element: <AppearanceSettings /> }
        ]
      }
    ]
  }
])
