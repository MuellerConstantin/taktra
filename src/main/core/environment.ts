/** What the core needs from the process that runs it, so it runs without Electron as well. */
export interface CoreEnvironment {
  /** Folder for app state, default profiles and backups. */
  readonly userDataPath: string
  readonly migrationsPath: string
  /** Moves a file to the trash of the operating system. */
  readonly trash: (path: string) => Promise<void>
}

let current: CoreEnvironment | null = null

export function setEnvironment(environment: CoreEnvironment): void {
  current = environment
}

export function getEnvironment(): CoreEnvironment {
  if (!current) throw new Error('The core has no environment yet')
  return current
}
