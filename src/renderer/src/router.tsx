import { createHashRouter, Navigate } from 'react-router'
import { AppTemplate } from './components/templates/AppTemplate'
import { ProfileTemplate } from './components/templates/ProfileTemplate'
import MiniTimerView from './views/MiniTimerView'
import QuickStartView from './views/QuickStartView'
import TimerView from './views/TimerView'
import TrackingView from './views/TrackingView'
import ProjectsView from './views/ProjectsView'
import ProjectDetailView from './views/ProjectDetailView'
import ActivityDetailView from './views/ActivityDetailView'
import ClientsView from './views/ClientsView'
import TagsView from './views/TagsView'
import TagDetailView from './views/TagDetailView'
import ReportsView from './views/ReportsView'
import ExportView from './views/ExportView'
import AppSettingsView from './views/settings/app/AppSettingsView'
import AppearanceSettings from './views/settings/app/AppearanceSettings'
import AssistantsSettings from './views/settings/app/AssistantsSettings'
import ControlsSettings from './views/settings/app/ControlsSettings'
import UpdatesSettings from './views/settings/app/UpdatesSettings'
import ProfileSettingsView from './views/settings/profile/ProfileSettingsView'
import ProfileGeneralSettings from './views/settings/profile/ProfileGeneralSettings'

export const router = createHashRouter([
  { path: '/mini', element: <MiniTimerView /> },
  { path: '/quick', element: <QuickStartView /> },
  {
    path: '/',
    element: <AppTemplate />,
    children: [
      { index: true, element: <Navigate to="/timer" replace /> },
      {
        element: <ProfileTemplate />,
        children: [
          { path: 'timer', element: <TimerView /> },
          { path: 'tracking', element: <TrackingView /> },
          { path: 'projects', element: <ProjectsView /> },
          { path: 'projects/:projectId', element: <ProjectDetailView /> },
          { path: 'activities/:activityId', element: <ActivityDetailView /> },
          { path: 'clients', element: <ClientsView /> },
          { path: 'tags', element: <TagsView /> },
          { path: 'tags/:tagId', element: <TagDetailView /> },
          { path: 'reports', element: <ReportsView /> },
          { path: 'export', element: <ExportView /> },
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
          { path: 'appearance', element: <AppearanceSettings /> },
          { path: 'controls', element: <ControlsSettings /> },
          { path: 'updates', element: <UpdatesSettings /> },
          { path: 'assistants', element: <AssistantsSettings /> }
        ]
      }
    ]
  }
])
