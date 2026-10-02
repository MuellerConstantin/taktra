import { join } from 'node:path'
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { app } from 'electron'
import { APPLICATION_ID } from '../constants'
import * as schema from './schema'

export type ProfileDatabase = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database
}

export class NewerProfileVersionError extends Error {
  constructor(path: string) {
    super(`Profile was created by a newer version of Taktra: ${path}`)
    this.name = 'NewerProfileVersionError'
  }
}

interface OpenOptions {
  readonly create?: boolean
  readonly readOnly?: boolean
}

function migrationsFolder(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src', 'main', 'db', 'migrations')
}

let latestKnownMigration: number | null = null

function getLatestKnownMigration(): number {
  latestKnownMigration ??= Math.max(
    0,
    ...readMigrationFiles({ migrationsFolder: migrationsFolder() }).map((m) => m.folderMillis)
  )
  return latestKnownMigration
}

function assertKnownSchema(client: Database.Database, path: string): void {
  const hasMigrationsTable = client
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'")
    .get()
  if (!hasMigrationsTable) return

  const { latest } = client
    .prepare('SELECT max(created_at) AS latest FROM __drizzle_migrations')
    .get() as { latest: number | null }

  if (latest !== null && latest > getLatestKnownMigration()) {
    throw new NewerProfileVersionError(path)
  }
}

export function openProfileDatabase(path: string, options: OpenOptions = {}): ProfileDatabase {
  const client = new Database(path, {
    fileMustExist: !options.create,
    readonly: options.readOnly ?? false
  })

  try {
    if (options.create) {
      client.pragma(`application_id = ${APPLICATION_ID}`)
    } else if (client.pragma('application_id', { simple: true }) !== APPLICATION_ID) {
      throw new Error(`Not a Taktra profile: ${path}`)
    }

    assertKnownSchema(client, path)
    client.pragma('foreign_keys = ON')

    const db = drizzle({ client, schema, casing: 'snake_case' })
    if (!options.readOnly) migrate(db, { migrationsFolder: migrationsFolder() })

    return db
  } catch (error) {
    client.close()
    throw error
  }
}

export function readProperty(db: ProfileDatabase, key: string): string | null {
  const row = db.select().from(schema.properties).where(eq(schema.properties.key, key)).get()
  return row?.value ?? null
}

export function writeProperty(db: ProfileDatabase, key: string, value: string): void {
  db.insert(schema.properties)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.properties.key, set: { value } })
    .run()
}

let active: { readonly path: string; readonly db: ProfileDatabase } | null = null

export function getActiveDatabase(): ProfileDatabase {
  if (!active) throw new Error('No active profile database')
  return active.db
}

export function activateDatabase(path: string | null): void {
  if (active?.path === path) return

  closeActiveDatabase()
  if (path) active = { path, db: openProfileDatabase(path) }
}

export function isActiveDatabase(path: string): boolean {
  return active?.path === path
}

export function closeActiveDatabase(): void {
  active?.db.$client.close()
  active = null
}

export function withProfileDatabase<T>(
  path: string,
  options: OpenOptions,
  fn: (db: ProfileDatabase) => T
): T {
  if (active?.path === path) return fn(active.db)

  const db = openProfileDatabase(path, options)
  try {
    return fn(db)
  } finally {
    db.$client.close()
  }
}
