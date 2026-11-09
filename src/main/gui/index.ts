import { app } from 'electron'
import type { LaunchOptions } from '@/shared/model/launchOptions'
import { optimizer } from '@electron-toolkit/utils'
import { initAbout } from './about'
import { registerIpcHandlers } from './ipc'
import { openMainWindow } from './mainWindow'
import { initMiniTimer } from './miniTimer'
import { initQuickStart } from './quickStart'
import { initQuit } from './quit'
import { initShortcuts } from './shortcuts'
import { initTaskbar } from './taskbar'
import { initTheme } from './theme'
import { initTray } from './tray'
import { initUpdates } from './updates'
import { appUserModelId, initWindowEvents, prepareQuit } from './windows'

export { openMainWindow }

export function startGui(applyLaunchOptions: (options: LaunchOptions) => void): void {
  if (process.platform === 'win32') app.setAppUserModelId(appUserModelId)
  initWindowEvents()
  initTheme()
  registerIpcHandlers()
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
  initTaskbar(applyLaunchOptions)

  app.on('activate', openMainWindow)
}
