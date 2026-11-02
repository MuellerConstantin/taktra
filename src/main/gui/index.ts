import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { initAbout } from './about'
import { initIpc } from './ipc'
import { openMainWindow } from './mainWindow'
import { initMiniTimer } from './miniTimer'
import { initQuickStart } from './quickStart'
import { initQuit } from './quit'
import { initShortcuts } from './shortcuts'
import { initTheme } from './theme'
import { initTray } from './tray'
import { initUpdates } from './updates'
import { initWindowEvents, prepareQuit } from './windows'

export function initGui(): void {
  electronApp.setAppUserModelId('app.taktra')
  initWindowEvents()
  initTheme()
  initIpc()
  initMiniTimer()
  initQuit()
  initAbout()
  initUpdates()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  app.on('before-quit', prepareQuit)
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  openMainWindow()
  initQuickStart()
  initShortcuts()
  initTray(openMainWindow)

  app.on('activate', openMainWindow)
  app.on('second-instance', openMainWindow)
}
