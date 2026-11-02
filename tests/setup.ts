import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll } from 'vitest'
import { setEnvironment } from '../src/main/core/environment'

/** The core runs under plain Node in tests, against its own temporary user data folder. */
const userDataPath = mkdtempSync(join(tmpdir(), 'taktra-test-'))

setEnvironment({
  userDataPath,
  migrationsPath: join(process.cwd(), 'src', 'main', 'core', 'db', 'migrations'),
  trash: async (path) => rmSync(path, { force: true })
})

// Hooks of the test file run first, so profiles they opened are closed again by now.
afterAll(() => {
  rmSync(userDataPath, { recursive: true, force: true })
})
