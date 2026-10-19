import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { openProfileDatabase, writeProperty, type ProfileDatabase } from '../src/main/db/database'

/** A new file path in the temporary user data folder, which the test setup removes afterwards. */
export function testProfilePath(): string {
  const folder = join(app.getPath('userData'), 'profiles')
  mkdirSync(folder, { recursive: true })
  return join(folder, `${randomUUID()}.taktra`)
}

/** Creates a profile with the current schema, the way the app does. */
export function createTestProfile(populate?: (db: ProfileDatabase) => void): string {
  const path = testProfilePath()
  const db = openProfileDatabase(path, { create: true })
  try {
    db.transaction(() => {
      writeProperty(db, 'uid', randomUUID())
      writeProperty(db, 'name', 'Test')
      populate?.(db)
    })
  } finally {
    db.$client.close()
  }
  return path
}
