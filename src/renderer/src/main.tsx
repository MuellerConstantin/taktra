import './main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
import SettingsProvider from './contexts/SettingsProvider'
import LocaleProvider from './contexts/LocaleProvider'
import ProfilesProvider from './contexts/ProfilesProvider'
import TimerProvider from './contexts/TimerProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <LocaleProvider>
        <ProfilesProvider>
          <TimerProvider>
            <RouterProvider router={router} />
          </TimerProvider>
        </ProfilesProvider>
      </LocaleProvider>
    </SettingsProvider>
  </StrictMode>
)
