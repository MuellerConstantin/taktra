import './identity'
import { join } from 'node:path'
import { app, shell } from 'electron'
import { startCore, stopCore } from './core'
import { startGui } from './gui'
import { applyLaunchOptions, initLaunchOptions } from './launch'

if (app.requestSingleInstanceLock()) {
  app.whenReady().then(() => {
    startCore({
      userDataPath: app.getPath('userData'),
      migrationsPath: app.isPackaged
        ? join(process.resourcesPath, 'migrations')
        : join(app.getAppPath(), 'src', 'main', 'core', 'db', 'migrations'),
      trash: (path) => shell.trashItem(path)
    })
    startGui(applyLaunchOptions)
    initLaunchOptions()
  })
  app.on('will-quit', stopCore)
} else {
  app.quit()
}
