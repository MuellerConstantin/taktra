import { createHashRouter, Navigate } from 'react-router'
import { AppTemplate } from './components/templates/AppTemplate'
import { ProfileTemplate } from './components/templates/ProfileTemplate'
import TrackingView from './views/TrackingView'
import ProjectsView from './views/ProjectsView'
import TagsView from './views/TagsView'
import ReportsView from './views/ReportsView'
import AppSettingsView from './views/settings/app/AppSettingsView'
import AppearanceSettings from './views/settings/app/AppearanceSettings'
import ProfileSettingsView from './views/settings/profile/ProfileSettingsView'
import ProfileGeneralSettings from './views/settings/profile/ProfileGeneralSettings'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppTemplate />,
    children: [
      { index: true, element: <Navigate to="/tracking" replace /> },
      {
        element: <ProfileTemplate />,
        children: [
          { path: 'tracking', element: <TrackingView /> },
          { path: 'projects', element: <ProjectsView /> },
          { path: 'tags', element: <TagsView /> },
          { path: 'reports', element: <ReportsView /> },
          {
            path: 'profile',
            element: <ProfileSettingsView />,
            children: [
              { index: true, element: <Navigate to="general" replace /> },
              { path: 'general', element: <ProfileGeneralSettings /> }
            ]
          }
        ]
      },
      {
        path: 'settings',
        element: <AppSettingsView />,
        children: [
          { index: true, element: <Navigate to="appearance" replace /> },
          { path: 'appearance', element: <AppearanceSettings /> }
        ]
      }
    ]
  }
])
