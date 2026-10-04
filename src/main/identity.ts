import { join } from 'node:path'
import { app } from 'electron'

/*
 * Imported first by index.ts, because the electron-store instances read the user data path
 * while their modules load. The folder stays lower-case: it would otherwise follow the
 * capitalized name, which on Linux is a different folder than the existing one.
 */
app.setPath('userData', join(app.getPath('appData'), 'taktra'))
app.setName('Taktra')
