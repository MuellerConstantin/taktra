import { join } from 'node:path'
import Database from 'better-sqlite3'
import { eq } from 'drizzle-orm'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { readMigrationFiles, type MigrationMeta } from 'drizzle-orm/migrator'
import { app } from 'electron'
import { AppError } from '../../shared/errors'
import { APPLICATION_ID } from '../constants'
import { backupBeforeMigration } from './backup'
import * as schema from './schema'

export type ProfileDatabase = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database
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

let knownMigrations: MigrationMeta[] | null = null

function getKnownMigrations(): MigrationMeta[] {
  knownMigrations ??= readMigrationFiles({ migrationsFolder: migrationsFolder() })
  return knownMigrations
}

function getLatestKnownMigration(): number {
  return Math.max(0, ...getKnownMigrations().map((migration) => migration.folderMillis))
}

function readLatestMigration(client: Database.Database): number | null {
  const hasMigrationsTable = client
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'")
    .get()
  if (!hasMigrationsTable) return null

  const { latest } = client
    .prepare('SELECT max(created_at) AS latest FROM __drizzle_migrations')
    .get() as { latest: number | null }
  return latest
}

function assertKnownSchema(client: Database.Database, path: string): void {
  const latest = readLatestMigration(client)
  if (latest !== null && latest > getLatestKnownMigration()) {
    throw new AppError('PROFILE_NEWER_VERSION', path)
  }
}

/**
 * Applies all pending migrations to a profile. Replaces drizzle's `migrate()`.
 *
 * drizzle's migrator runs the migrations inside a transaction. There, the
 * `PRAGMA foreign_keys=OFF` that drizzle-kit emits for table rebuilds has no effect
 * (SQLite ignores it within a transaction), so dropping the old table would cascade
 * deletes into child tables. This follows SQLite's procedure for schema changes
 * instead: https://www.sqlite.org/lang_altertable.html#otheralter
 *
 * Only the public `readMigrationFiles()` and the layout of drizzle's
 * `__drizzle_migrations` table are relied on, the same ones `assertKnownSchema`
 * uses. Profiles stay compatible with drizzle's own migrator.
 *
 * Existing profiles are backed up first (see `backupBeforeMigration`); new ones have
 * nothing to lose.
 *
 * @throws if the backup fails, a statement fails or the result violates a foreign key;
 * the transaction is rolled back and the file stays unchanged.
 */
function migrate(client: Database.Database): void {
  // Same rule as drizzle: everything newer than the latest applied migration is pending.
  const latest = readLatestMigration(client)
  const pending = getKnownMigrations().filter(
    (migration) => latest === null || migration.folderMillis > latest
  )
  if (pending.length === 0) return

  if (latest !== null) backupBeforeMigration(client)

  /*
   * Must happen outside the transaction, otherwise SQLite silently ignores it.
   * openProfileDatabase switches foreign keys back on afterwards.
   */
  client.pragma('foreign_keys = OFF')

  // One transaction for all pending migrations: either all are applied or none.
  client.transaction(() => {
    client.exec(
      'CREATE TABLE IF NOT EXISTS __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)'
    )
    const record = client.prepare(
      'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)'
    )

    /*
     * drizzle-kit splits each migration file at its statement breakpoints. The PRAGMA
     * statements it contains run as no-ops here.
     */
    for (const migration of pending) {
      for (const statement of migration.sql) {
        if (statement.trim()) client.exec(statement)
      }
      record.run(migration.hash, migration.folderMillis)
    }

    // With foreign keys off nothing was checked so far; throwing rolls everything back.
    const violations = client.pragma('foreign_key_check') as unknown[]
    if (violations.length > 0) {
      throw new Error(`Migration violates foreign keys: ${JSON.stringify(violations)}`)
    }
  })()
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
      throw new AppError('PROFILE_INVALID', path)
    }

    assertKnownSchema(client, path)
    if (!options.readOnly) migrate(client)
    client.pragma('foreign_keys = ON')

    return drizzle({ client, schema, casing: 'snake_case' })
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
  if (!active) throw new AppError('NO_ACTIVE_PROFILE')
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
