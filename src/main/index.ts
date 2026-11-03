import './identity'
import { join } from 'node:path'
import { app, shell } from 'electron'
import { startApi, stopApi } from './api'
import { startCore, stopCore } from './core'
import { startGui } from './gui'

if (app.requestSingleInstanceLock()) {
  app.whenReady().then(() => {
    startCore({
      userDataPath: app.getPath('userData'),
      migrationsPath: app.isPackaged
        ? join(process.resourcesPath, 'migrations')
        : join(app.getAppPath(), 'src', 'main', 'core', 'db', 'migrations'),
      trash: (path) => shell.trashItem(path)
    })
    startGui()
    startApi()
  })
  app.on('will-quit', () => {
    void stopApi()
    stopCore()
  })
} else {
  app.quit()
}
