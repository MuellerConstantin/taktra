import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import { app } from 'electron'

const KEPT_BACKUPS = 3

/**
 * Copies a profile to `backups/<profile uid>/` in the user data directory before it is
 * migrated, so a migration that runs cleanly but damages data can still be undone by hand.
 * Keeps the newest {@link KEPT_BACKUPS} copies per profile.
 */
export function backupBeforeMigration(client: Database.Database): void {
  const row = client.prepare("SELECT value FROM properties WHERE key = 'uid'").get() as
    { value: string } | undefined
  if (!row) throw new Error('Profile has no uid to name its backup folder')

  const folder = join(app.getPath('userData'), 'backups', row.value)
  mkdirSync(folder, { recursive: true })

  // ISO timestamps sort chronologically; colons are not allowed in Windows file names.
  const file = join(folder, `${new Date().toISOString().replaceAll(':', '-')}.taktra`)
  // VACUUM INTO writes a consistent copy through the open connection, even with sidecar files.
  client.prepare('VACUUM INTO ?').run(file)

  const backups = readdirSync(folder)
    .filter((name) => name.endsWith('.taktra'))
    .sort()
  for (const name of backups.slice(0, -KEPT_BACKUPS)) rmSync(join(folder, name))
}
