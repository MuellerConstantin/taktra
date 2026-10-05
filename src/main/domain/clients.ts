import { eq, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Client, ClientData } from '../../shared/clients'
import { AppError } from '../../shared/errors'
import { clientInput, id, listOptions } from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import { activities, clients, projects, timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { sortByName, toNameKey } from './names'
import { notifyTimerChanged } from './timerEvents'

/** The client that counts for an activity: the one of its project, else its own. */
export const effectiveClientId = sql<
  number | null
>`coalesce(${projects.clientId}, ${activities.clientId})`

export const effectiveClientJoin = eq(clients.id, effectiveClientId)

export const clientRef = { id: clients.id, name: clients.name }

export function findClient(id: number): Client {
  const client = getActiveDatabase().select().from(clients).where(eq(clients.id, id)).get()
  if (!client) throw new AppError('CLIENT_NOT_FOUND', String(id))
  return client
}

export function listClients({
  includeArchived = false
}: z.output<typeof listOptions> = {}): Client[] {
  return sortByName(
    getActiveDatabase()
      .select()
      .from(clients)
      .where(includeArchived ? undefined : isNull(clients.archivedAt))
      .all()
  )
}

export function createClient(input: ClientData): Client {
  try {
    return getActiveDatabase()
      .insert(clients)
      .values({ ...input, nameKey: toNameKey(input.name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CLIENT_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateClient(id: number, patch: Partial<ClientData>): Client {
  findClient(id)

  try {
    const client = getActiveDatabase()
      .update(clients)
      .set(patch.name === undefined ? patch : { ...patch, nameKey: toNameKey(patch.name) })
      .where(eq(clients.id, id))
      .returning()
      .get()
    notifyTimerChanged()
    return client
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CLIENT_NAME_TAKEN', String(error))
    throw error
  }
}

export function setClientArchived(id: number, archived: boolean): Client {
  findClient(id)

  return getActiveDatabase()
    .update(clients)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(clients.id, id))
    .returning()
    .get()
}

/**
 * The foreign keys have no ON DELETE action (drizzle-kit drops it for added columns), so the
 * references are cleared first.
 */
export function deleteClient(id: number): void {
  findClient(id)

  const db = getActiveDatabase()
  const hasEntries = db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .where(or(eq(projects.clientId, id), eq(activities.clientId, id)))
    .limit(1)
    .get()
  if (hasEntries) throw new AppError('CLIENT_HAS_TIME_ENTRIES', String(id))

  db.transaction((tx) => {
    tx.update(projects).set({ clientId: null }).where(eq(projects.clientId, id)).run()
    tx.update(activities).set({ clientId: null }).where(eq(activities.clientId, id)).run()
    tx.delete(clients).where(eq(clients.id, id)).run()
  })
  notifyTimerChanged()
}

export function initClients(): void {
  handle('clients:list', z.tuple([listOptions]), (_, options) => listClients(options))
  handle('clients:get', z.tuple([id]), (_, clientId) => findClient(clientId))
  handle('clients:create', z.tuple([clientInput]), (_, input) => createClient(input))
  handle('clients:update', z.tuple([id, clientInput.partial()]), (_, clientId, patch) =>
    updateClient(clientId, patch)
  )
  handle('clients:setArchived', z.tuple([id, z.boolean()]), (_, clientId, archived) =>
    setClientArchived(clientId, archived)
  )
  handle('clients:delete', z.tuple([id]), (_, clientId) => deleteClient(clientId))
}
