import './identity'
import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initAbout } from './desktop/about'
import { attachMiniTimer, initMiniTimer } from './desktop/miniTimer'
import { initQuickStart } from './desktop/quickStart'
import { initQuit } from './desktop/quit'
import { initShortcuts } from './desktop/shortcuts'
import { initTray } from './desktop/tray'
import { initUpdates } from './desktop/updates'
import {
  createRendererWindow,
  hasMainWindow,
  isQuitting,
  prepareQuit,
  setMainWindow,
  showMainWindow
} from './desktop/windows'
import { initActivities } from './domain/activities'
import { initClients } from './domain/clients'
import { initDonation, recordUsageDay } from './donation'
import { initExport } from './domain/export'
import { initProjects } from './domain/projects'
import { initReports } from './domain/reports'
import { initTags } from './domain/tags'
import { initTimeEntries } from './domain/timeEntries'
import { initTimer } from './domain/timer'
import { initProfiles } from './profiles'
import { initSettings } from './settings'

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

  mainWindow.on('focus', recordUsageDay)

  mainWindow.on('close', (event) => {
    if (isQuitting()) return
    event.preventDefault()
    mainWindow.hide()
  })

  setDevAppDetails(mainWindow)
  setMainWindow(mainWindow)
  attachMiniTimer(mainWindow)
}

/*
 * In development the process is electron.exe without the installer's shortcut, so Windows
 * would label the taskbar entry and its jump list "Electron" with Electron's icon.
 */
function setDevAppDetails(window: BrowserWindow): void {
  if (!is.dev || process.platform !== 'win32') {
    return
  }

  window.setAppDetails({
    appId: 'app.taktra',
    appIconPath: join(app.getAppPath(), 'build', 'icon.ico'),
    relaunchCommand: `"${process.execPath}" "${app.getAppPath()}"`,
    relaunchDisplayName: app.getName()
  })
}

function openMainWindow(): void {
  if (hasMainWindow()) showMainWindow()
  else createWindow()
}

function start(): void {
  electronApp.setAppUserModelId('app.taktra')
  initSettings()
  initProfiles()
  initClients()
  initProjects()
  initTags()
  initActivities()
  initTimeEntries()
  initTimer()
  initMiniTimer()
  initReports()
  initExport()
  initQuit()
  initAbout()
  initUpdates()
  initDonation()

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

app.on('before-quit', prepareQuit)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
