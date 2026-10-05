import { eq, isNull, or } from 'drizzle-orm'
import { z } from 'zod'
import type { Customer, CustomerData } from '../../shared/customers'
import { AppError } from '../../shared/errors'
import { customerInput, id, listOptions } from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import { activities, customers, projects, timeEntries } from '../db/schema'
import { handle } from '../ipc'
import { sortByName, toNameKey } from './names'
import { notifyTimerChanged } from './timerEvents'

export function findCustomer(id: number): Customer {
  const customer = getActiveDatabase().select().from(customers).where(eq(customers.id, id)).get()
  if (!customer) throw new AppError('CUSTOMER_NOT_FOUND', String(id))
  return customer
}

export function listCustomers({
  includeArchived = false
}: z.output<typeof listOptions> = {}): Customer[] {
  return sortByName(
    getActiveDatabase()
      .select()
      .from(customers)
      .where(includeArchived ? undefined : isNull(customers.archivedAt))
      .all()
  )
}

export function createCustomer(input: CustomerData): Customer {
  try {
    return getActiveDatabase()
      .insert(customers)
      .values({ ...input, nameKey: toNameKey(input.name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CUSTOMER_NAME_TAKEN', String(error))
    throw error
  }
}

export function updateCustomer(id: number, patch: Partial<CustomerData>): Customer {
  findCustomer(id)

  try {
    const customer = getActiveDatabase()
      .update(customers)
      .set(patch.name === undefined ? patch : { ...patch, nameKey: toNameKey(patch.name) })
      .where(eq(customers.id, id))
      .returning()
      .get()
    notifyTimerChanged()
    return customer
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CUSTOMER_NAME_TAKEN', String(error))
    throw error
  }
}

export function setCustomerArchived(id: number, archived: boolean): Customer {
  findCustomer(id)

  return getActiveDatabase()
    .update(customers)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(customers.id, id))
    .returning()
    .get()
}

/**
 * The foreign keys have no ON DELETE action (drizzle-kit drops it for added columns), so the
 * references are cleared first.
 */
export function deleteCustomer(id: number): void {
  findCustomer(id)

  const db = getActiveDatabase()
  const hasEntries = db
    .select({ id: timeEntries.id })
    .from(timeEntries)
    .innerJoin(activities, eq(timeEntries.activityId, activities.id))
    .innerJoin(projects, eq(activities.projectId, projects.id))
    .where(or(eq(projects.customerId, id), eq(activities.customerId, id)))
    .limit(1)
    .get()
  if (hasEntries) throw new AppError('CUSTOMER_HAS_TIME_ENTRIES', String(id))

  db.transaction((tx) => {
    tx.update(projects).set({ customerId: null }).where(eq(projects.customerId, id)).run()
    tx.update(activities).set({ customerId: null }).where(eq(activities.customerId, id)).run()
    tx.delete(customers).where(eq(customers.id, id)).run()
  })
  notifyTimerChanged()
}

export function initCustomers(): void {
  handle('customers:list', z.tuple([listOptions]), (_, options) => listCustomers(options))
  handle('customers:get', z.tuple([id]), (_, customerId) => findCustomer(customerId))
  handle('customers:create', z.tuple([customerInput]), (_, input) => createCustomer(input))
  handle('customers:update', z.tuple([id, customerInput.partial()]), (_, customerId, patch) =>
    updateCustomer(customerId, patch)
  )
  handle('customers:setArchived', z.tuple([id, z.boolean()]), (_, customerId, archived) =>
    setCustomerArchived(customerId, archived)
  )
  handle('customers:delete', z.tuple([id]), (_, customerId) => deleteCustomer(customerId))
}
