import { join } from 'node:path'
import { app } from 'electron'

/*
 * Imported first by index.ts, because the electron-store instances read the user data path
 * while their modules load. The folder stays lower-case: it would otherwise follow the
 * capitalized name, which on Linux is a different folder than the existing one.
 * End-to-end tests pass their own folder, so they never touch real profiles and settings.
 */
app.setPath('userData', process.env['TAKTRA_USER_DATA'] ?? join(app.getPath('appData'), 'taktra'))
app.setName('Taktra')
