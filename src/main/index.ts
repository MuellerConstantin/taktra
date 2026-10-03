import { app, nativeTheme } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initActivities } from './activities'
import { attachMiniTimer, initMiniTimer } from './miniTimer'
import { initProfiles } from './profiles'
import { initProjects } from './projects'
import { initReports } from './reports'
import { initSettings } from './settings'
import { initTags } from './tags'
import { initTimeEntries } from './timeEntries'
import { initTimer } from './timer'
import { initTray } from './tray'
import { createRendererWindow, hasMainWindow, setMainWindow, showMainWindow } from './windows'

let isQuitting = false

function createWindow(): void {
  const mainWindow = createRendererWindow(
    {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      icon,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#0c0a0f' : '#fbf9fc'
    },
    ''
  )

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow.hide()
  })

  setMainWindow(mainWindow)
  attachMiniTimer(mainWindow)
}

function openMainWindow(): void {
  if (hasMainWindow()) showMainWindow()
  else createWindow()
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('app.taktra')
  initSettings()
  initProfiles()
  initProjects()
  initTags()
  initActivities()
  initTimeEntries()
  initTimer()
  initMiniTimer()
  initReports()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  initTray(openMainWindow)

  app.on('activate', openMainWindow)
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
