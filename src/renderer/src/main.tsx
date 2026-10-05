import './main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setInteractionModality } from 'react-aria-components'
import { RouterProvider } from 'react-router'
import { router } from './router'
import SettingsProvider from './contexts/SettingsProvider'
import LocaleProvider from './contexts/LocaleProvider'
import ProfilesProvider from './contexts/ProfilesProvider'
import TimerProvider from './contexts/TimerProvider'

/*
 * React Aria keeps the last modality across window blur, so refocusing the window would show the
 * focus ring and open the tooltip of the focused control, positioned before the restored window
 * has its size again.
 */
window.addEventListener('blur', () => setInteractionModality('pointer'))

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
