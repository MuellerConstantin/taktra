import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme } from 'electron'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'
import { donation } from '@/main/core'
import { attachMiniTimer } from './miniTimer'
import {
  appUserModelId,
  createRendererWindow,
  hasMainWindow,
  isQuitting,
  setMainWindow,
  showMainWindow
} from './windows'

function createMainWindow(): void {
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

  mainWindow.on('focus', donation.recordUsageDay)

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
    appId: appUserModelId,
    appIconPath: join(app.getAppPath(), 'build', 'icon.ico'),
    relaunchCommand: `"${process.execPath}" "${app.getAppPath()}"`,
    relaunchDisplayName: app.getName()
  })
}

export function openMainWindow(): void {
  if (hasMainWindow()) showMainWindow()
  else createMainWindow()
}
