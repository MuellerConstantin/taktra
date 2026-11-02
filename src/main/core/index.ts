import { openActiveProfile } from './app/profiles'
import { closeActiveDatabase } from './db/database'
import { setEnvironment, type CoreEnvironment } from './environment'

export type { CoreEnvironment } from './environment'

export function initCore(environment: CoreEnvironment): void {
  setEnvironment(environment)
  openActiveProfile()
}

export function closeCore(): void {
  closeActiveDatabase()
}
