import './identity'
import { app } from 'electron'
import { initCore } from './core'
import { initGui } from './gui'

if (app.requestSingleInstanceLock()) {
  app.whenReady().then(() => {
    initCore()
    initGui()
  })
} else {
  app.quit()
}
