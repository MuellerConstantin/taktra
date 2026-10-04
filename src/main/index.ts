import { app, nativeTheme } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { z } from 'zod'
import icon from '../../resources/icon.png?asset'
import { attachMiniTimer, initMiniTimer } from './desktop/miniTimer'
import { initQuickStart } from './desktop/quickStart'
import { initShortcuts } from './desktop/shortcuts'
import { initTray } from './desktop/tray'
import {
  createRendererWindow,
  hasMainWindow,
  setMainWindow,
  showMainWindow
} from './desktop/windows'
import { initActivities } from './domain/activities'
import { initExport } from './domain/export'
import { initProjects } from './domain/projects'
import { initReports } from './domain/reports'
import { initTags } from './domain/tags'
import { initTimeEntries } from './domain/timeEntries'
import { initTimer } from './domain/timer'
import { handle } from './ipc'
import { initProfiles } from './profiles'
import { initSettings } from './settings'

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

function start(): void {
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
  initExport()
  handle('app:quit', z.tuple([]), () => app.quit())

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  initQuickStart()
  initShortcuts()
  initTray(openMainWindow)

  app.on('activate', openMainWindow)
}

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', openMainWindow)
  app.whenReady().then(start)
} else {
  app.quit()
}

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
