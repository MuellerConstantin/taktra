import { randomUUID } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import Database from 'better-sqlite3'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { app } from 'electron'
import { describe, expect, it } from 'vitest'
import { APPLICATION_ID } from '../../../src/main/constants'
import { createTestProfile, testProfilePath } from '../../profiles'
import { openProfileDatabase } from '../../../src/main/db/database'

const MIGRATIONS_FOLDER = 'src/main/db/migrations'
const SEEDS_FOLDER = 'tests/main/db/seeds'

const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER })

const migrationTags = (
  JSON.parse(readFileSync(join(MIGRATIONS_FOLDER, 'meta', '_journal.json'), 'utf8')) as {
    entries: { tag: string }[]
  }
).entries.map(({ tag }) => tag)

type Snapshot = Record<string, { readonly columns: string[]; readonly rows: unknown[] }>

/**
 * Data an earlier version may hold. Each file is named after the migration that created its
 * tables and is loaded into every profile that has this migration.
 */
const seeds = readdirSync(SEEDS_FOLDER)
  .map((file) => {
    const since = migrationTags.indexOf(basename(file, '.sql'))
    if (since === -1) throw new Error(`Seed ${file} is not named after a migration`)
    return { since, sql: readFileSync(join(SEEDS_FOLDER, file), 'utf8') }
  })
  .sort((a, b) => a.since - b.since)

/** A profile as the version that knew only the first `count` migrations left it. */
function createProfileAt(count: number, seed: (client: Database.Database) => void): string {
  const path = testProfilePath()
  const client = new Database(path)
  try {
    client.pragma(`application_id = ${APPLICATION_ID}`)
    client.exec(
      'CREATE TABLE __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)'
    )
    for (const migration of migrations.slice(0, count)) {
      for (const statement of migration.sql) {
        if (statement.trim()) client.exec(statement)
      }
      client
        .prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)')
        .run(migration.hash, migration.folderMillis)
    }
    client
      .prepare("INSERT INTO properties (key, value) VALUES ('uid', ?), ('name', 'Old')")
      .run(randomUUID())
    seed(client)
  } finally {
    client.close()
  }
  return path
}

function withClient<T>(path: string, fn: (client: Database.Database) => T): T {
  const client = new Database(path, { fileMustExist: true })
  try {
    return fn(client)
  } finally {
    client.close()
  }
}

function countMigrations(client: Database.Database): number {
  return (
    client.prepare('SELECT count(*) AS count FROM __drizzle_migrations').get() as {
      count: number
    }
  ).count
}

function readUid(client: Database.Database): string {
  return (
    client.prepare("SELECT value FROM properties WHERE key = 'uid'").get() as {
      value: string
    }
  ).value
}

function listTables(client: Database.Database): string[] {
  return (
    client
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> '__drizzle_migrations'"
      )
      .all() as { name: string }[]
  ).map(({ name }) => name)
}

/** All rows of the given columns, sorted by all of them so the row order does not matter. */
function selectRows(
  client: Database.Database,
  table: string,
  columns: readonly string[]
): unknown[] {
  const list = columns.map((column) => `"${column}"`).join(', ')
  return client.prepare(`SELECT ${list} FROM "${table}" ORDER BY ${list}`).all()
}

function takeSnapshot(client: Database.Database): Snapshot {
  return Object.fromEntries(
    listTables(client).map((table) => {
      const columns = (client.pragma(`table_info("${table}")`) as { name: string }[]).map(
        ({ name }) => name
      )
      return [table, { columns, rows: selectRows(client, table, columns) }]
    })
  )
}

/** The same tables and columns as in `before`; columns added by later migrations are ignored. */
function takeSnapshotLike(client: Database.Database, before: Snapshot): Snapshot {
  return Object.fromEntries(
    Object.entries(before).map(([table, { columns }]) => [
      table,
      { columns, rows: selectRows(client, table, columns) }
    ])
  )
}

describe('openProfileDatabase', () => {
  it('creates a profile with all migrations applied', () => {
    const path = createTestProfile()

    withClient(path, (client) => {
      expect(client.pragma('application_id', { simple: true })).toBe(APPLICATION_ID)
      expect(countMigrations(client)).toBe(migrations.length)
      expect(client.pragma('foreign_key_check')).toEqual([])
    })
  })

  it('opens an up-to-date profile without a backup', () => {
    const path = createTestProfile()
    const uid = withClient(path, readUid)

    openProfileDatabase(path).$client.close()

    expect(existsSync(join(app.getPath('userData'), 'backups', uid))).toBe(false)
  })

  it.each(migrations.slice(1).map((_, index) => index + 1))(
    'migrates a profile with %i migrations and keeps its data',
    (count) => {
      const path = createProfileAt(count, (client) => {
        for (const { since, sql } of seeds) if (since < count) client.exec(sql)
      })
      const [uid, before] = withClient(path, (client) => [readUid(client), takeSnapshot(client)])

      const db = openProfileDatabase(path)
      try {
        expect(countMigrations(db.$client)).toBe(migrations.length)
        expect(db.$client.pragma('foreign_key_check')).toEqual([])
        expect(takeSnapshotLike(db.$client, before)).toEqual(before)
      } finally {
        db.$client.close()
      }

      const backups = join(app.getPath('userData'), 'backups', uid)
      const files = readdirSync(backups)
      expect(files).toHaveLength(1)
      withClient(join(backups, files[0]), (client) => {
        expect(countMigrations(client)).toBe(count)
        expect(takeSnapshot(client)).toEqual(before)
      })
    }
  )

  it('leaves the file unchanged when a migration fails', () => {
    const layoutCheck = migrations.findIndex((migration) =>
      migration.sql.some((statement) => statement.includes('"export_templates_layout"'))
    )
    const path = createProfileAt(layoutCheck, (client) => {
      for (const { sql } of seeds) client.exec(sql)
      client.exec("UPDATE export_templates SET layout = 'unknown'")
    })
    const before = withClient(path, takeSnapshot)

    expect(() => openProfileDatabase(path)).toThrow(
      expect.objectContaining({ code: 'PROFILE_MIGRATION_FAILED' })
    )

    withClient(path, (client) => {
      expect(countMigrations(client)).toBe(layoutCheck)
      expect(takeSnapshot(client)).toEqual(before)
    })
  })

  it('refuses a profile written by a newer version', () => {
    const path = createTestProfile()
    withClient(path, (client) => {
      client
        .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('future', ?)")
        .run(Math.max(...migrations.map((migration) => migration.folderMillis)) + 1)
    })

    expect(() => openProfileDatabase(path)).toThrow(
      expect.objectContaining({ code: 'PROFILE_NEWER_VERSION' })
    )
    expect(() => openProfileDatabase(path, { readOnly: true })).toThrow(
      expect.objectContaining({ code: 'PROFILE_NEWER_VERSION' })
    )
  })

  it('refuses a database that is not a profile', () => {
    const path = testProfilePath()
    new Database(path).close()

    expect(() => openProfileDatabase(path)).toThrow(
      expect.objectContaining({ code: 'PROFILE_INVALID' })
    )
  })
})
