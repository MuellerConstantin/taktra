import { app, BrowserWindow, nativeTheme } from 'electron'
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
import { createRendererWindow } from './windows'

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

  attachMiniTimer(mainWindow)
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
