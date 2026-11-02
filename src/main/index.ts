import './identity'
import { join } from 'node:path'
import { app, shell } from 'electron'
import { closeCore, initCore } from './core'
import { initGui } from './gui'

if (app.requestSingleInstanceLock()) {
  app.whenReady().then(() => {
    initCore({
      userDataPath: app.getPath('userData'),
      migrationsPath: app.isPackaged
        ? join(process.resourcesPath, 'migrations')
        : join(app.getAppPath(), 'src', 'main', 'core', 'db', 'migrations'),
      trash: (path) => shell.trashItem(path)
    })
    initGui()
  })
  app.on('will-quit', closeCore)
} else {
  app.quit()
}
