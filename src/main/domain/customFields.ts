import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import type {
  CustomField,
  CustomFieldOption,
  CustomFieldScope,
  CustomFieldWithOptions,
  FieldValue,
  FieldValueData
} from '../../shared/customFields'
import { AppError } from '../../shared/errors'
import { toNameKey } from '../../shared/names'
import {
  customFieldInput,
  customFieldListOptions,
  customFieldScope,
  fieldValueInput,
  id,
  MAX_ACTIVE_CUSTOM_FIELDS,
  MAX_ACTIVE_FIELD_OPTIONS,
  name
} from '../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import {
  activityFieldValues,
  clientFieldValues,
  customFieldOptions,
  customFields,
  projectFieldValues
} from '../db/schema'
import { handle } from '../ipc'
import { findActivity } from './activities'
import { findClient } from './clients'
import { sortByName } from './names'
import { findProject } from './projects'

const valueTables = {
  project: {
    table: projectFieldValues,
    ownerId: projectFieldValues.projectId,
    findOwner: findProject,
    insert: (ownerId: number, value: FieldValue) =>
      getActiveDatabase()
        .insert(projectFieldValues)
        .values({ projectId: ownerId, ...value })
        .run()
  },
  client: {
    table: clientFieldValues,
    ownerId: clientFieldValues.clientId,
    findOwner: findClient,
    insert: (ownerId: number, value: FieldValue) =>
      getActiveDatabase()
        .insert(clientFieldValues)
        .values({ clientId: ownerId, ...value })
        .run()
  },
  activity: {
    table: activityFieldValues,
    ownerId: activityFieldValues.activityId,
    findOwner: findActivity,
    insert: (ownerId: number, value: FieldValue) =>
      getActiveDatabase()
        .insert(activityFieldValues)
        .values({ activityId: ownerId, ...value })
        .run()
  }
}

export function findCustomField(id: number): CustomField {
  const field = getActiveDatabase().select().from(customFields).where(eq(customFields.id, id)).get()
  if (!field) throw new AppError('CUSTOM_FIELD_NOT_FOUND', String(id))
  return field
}

function findOption(id: number): CustomFieldOption {
  const option = getActiveDatabase()
    .select()
    .from(customFieldOptions)
    .where(eq(customFieldOptions.id, id))
    .get()
  if (!option) throw new AppError('CUSTOM_FIELD_OPTION_NOT_FOUND', String(id))
  return option
}

export function listCustomFields({
  scope,
  includeArchived = false
}: z.output<typeof customFieldListOptions> = {}): CustomFieldWithOptions[] {
  const db = getActiveDatabase()
  const fields = sortByName(
    db
      .select()
      .from(customFields)
      .where(
        and(
          scope === undefined ? undefined : eq(customFields.scope, scope),
          includeArchived ? undefined : isNull(customFields.archivedAt)
        )
      )
      .all()
  )
  if (fields.length === 0) return []

  const options = sortByName(
    db
      .select()
      .from(customFieldOptions)
      .where(
        inArray(
          customFieldOptions.fieldId,
          fields.map((field) => field.id)
        )
      )
      .all()
  )
  return fields.map((field) => ({
    ...field,
    options: options.filter((option) => option.fieldId === field.id)
  }))
}

function assertFieldLimit(scope: CustomFieldScope): void {
  const { active } = getActiveDatabase()
    .select({ active: count() })
    .from(customFields)
    .where(and(eq(customFields.scope, scope), isNull(customFields.archivedAt)))
    .get()!
  if (active >= MAX_ACTIVE_CUSTOM_FIELDS) throw new AppError('CUSTOM_FIELD_LIMIT_REACHED', scope)
}

export function createCustomField(input: z.output<typeof customFieldInput>): CustomField {
  assertFieldLimit(input.scope)

  try {
    return getActiveDatabase()
      .insert(customFields)
      .values({ ...input, nameKey: toNameKey(input.name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CUSTOM_FIELD_NAME_TAKEN', String(error))
    throw error
  }
}

export function renameCustomField(id: number, name: string): CustomField {
  findCustomField(id)

  try {
    return getActiveDatabase()
      .update(customFields)
      .set({ name, nameKey: toNameKey(name) })
      .where(eq(customFields.id, id))
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CUSTOM_FIELD_NAME_TAKEN', String(error))
    throw error
  }
}

export function setCustomFieldArchived(id: number, archived: boolean): CustomField {
  const field = findCustomField(id)
  if (!archived && field.archivedAt) assertFieldLimit(field.scope)

  return getActiveDatabase()
    .update(customFields)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(customFields.id, id))
    .returning()
    .get()
}

export function deleteCustomField(id: number): void {
  const field = findCustomField(id)
  const { table } = valueTables[field.scope]

  const db = getActiveDatabase()
  const inUse = db
    .select({ fieldId: table.fieldId })
    .from(table)
    .where(eq(table.fieldId, id))
    .limit(1)
    .get()
  if (inUse) throw new AppError('CUSTOM_FIELD_IN_USE', String(id))
  db.delete(customFields).where(eq(customFields.id, id)).run()
}

function assertOptionLimit(fieldId: number): void {
  const { active } = getActiveDatabase()
    .select({ active: count() })
    .from(customFieldOptions)
    .where(and(eq(customFieldOptions.fieldId, fieldId), isNull(customFieldOptions.archivedAt)))
    .get()!
  if (active >= MAX_ACTIVE_FIELD_OPTIONS)
    throw new AppError('CUSTOM_FIELD_OPTION_LIMIT_REACHED', String(fieldId))
}

export function createCustomFieldOption(fieldId: number, name: string): CustomFieldOption {
  const field = findCustomField(fieldId)
  if (field.type !== 'select')
    throw new AppError('VALIDATION_FAILED', `Field ${fieldId} has no options`)
  assertOptionLimit(fieldId)

  try {
    return getActiveDatabase()
      .insert(customFieldOptions)
      .values({ fieldId, name, nameKey: toNameKey(name) })
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error))
      throw new AppError('CUSTOM_FIELD_OPTION_NAME_TAKEN', String(error))
    throw error
  }
}

export function renameCustomFieldOption(id: number, name: string): CustomFieldOption {
  findOption(id)

  try {
    return getActiveDatabase()
      .update(customFieldOptions)
      .set({ name, nameKey: toNameKey(name) })
      .where(eq(customFieldOptions.id, id))
      .returning()
      .get()
  } catch (error) {
    if (isUniqueViolation(error))
      throw new AppError('CUSTOM_FIELD_OPTION_NAME_TAKEN', String(error))
    throw error
  }
}

export function setCustomFieldOptionArchived(id: number, archived: boolean): CustomFieldOption {
  const option = findOption(id)
  if (!archived && option.archivedAt) assertOptionLimit(option.fieldId)

  return getActiveDatabase()
    .update(customFieldOptions)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(customFieldOptions.id, id))
    .returning()
    .get()
}

export function deleteCustomFieldOption(id: number): void {
  const option = findOption(id)
  const { table } = valueTables[findCustomField(option.fieldId).scope]

  const db = getActiveDatabase()
  const inUse = db
    .select({ optionId: table.optionId })
    .from(table)
    .where(eq(table.optionId, id))
    .limit(1)
    .get()
  if (inUse) throw new AppError('CUSTOM_FIELD_OPTION_IN_USE', String(id))
  db.delete(customFieldOptions).where(eq(customFieldOptions.id, id)).run()
}

function selectFieldValues(scope: CustomFieldScope, ownerId: number): FieldValue[] {
  const { table, ownerId: ownerColumn } = valueTables[scope]
  return getActiveDatabase()
    .select({ fieldId: table.fieldId, textValue: table.textValue, optionId: table.optionId })
    .from(table)
    .where(eq(ownerColumn, ownerId))
    .all()
}

export function getFieldValues(scope: CustomFieldScope, ownerId: number): FieldValue[] {
  valueTables[scope].findOwner(ownerId)
  return selectFieldValues(scope, ownerId)
}

function assertValueAllowed(scope: CustomFieldScope, value: FieldValueData): void {
  const field = findCustomField(value.fieldId)
  if (field.scope !== scope)
    throw new AppError('VALIDATION_FAILED', `Field ${field.id} does not belong to ${scope}`)
  if (field.archivedAt) throw new AppError('VALIDATION_FAILED', `Field ${field.id} is archived`)
  if (field.type === 'text' && value.optionId !== null)
    throw new AppError('VALIDATION_FAILED', `Field ${field.id} takes text`)
  if (field.type === 'select' && value.textValue !== null)
    throw new AppError('VALIDATION_FAILED', `Field ${field.id} takes an option`)
  if (value.optionId === null) return

  const option = findOption(value.optionId)
  if (option.fieldId !== field.id || option.archivedAt)
    throw new AppError('VALIDATION_FAILED', `Option ${option.id} is not selectable`)
}

/**
 * Sets the given fields and leaves all others untouched; an empty value removes the field's
 * value. Unchanged values are accepted even if their field or option has been archived since.
 */
export function setFieldValues(
  scope: CustomFieldScope,
  ownerId: number,
  values: readonly FieldValueData[]
): FieldValue[] {
  const { table, ownerId: ownerColumn, findOwner, insert } = valueTables[scope]
  findOwner(ownerId)

  const db = getActiveDatabase()
  db.transaction(() => {
    const current = new Map(
      selectFieldValues(scope, ownerId).map((value) => [value.fieldId, value])
    )
    for (const value of values) {
      const previous = current.get(value.fieldId)
      if (
        (previous?.textValue ?? null) === value.textValue &&
        (previous?.optionId ?? null) === value.optionId
      )
        continue

      assertValueAllowed(scope, value)
      db.delete(table)
        .where(and(eq(ownerColumn, ownerId), eq(table.fieldId, value.fieldId)))
        .run()
      if (value.textValue !== null || value.optionId !== null) insert(ownerId, value)
    }
  })
  return selectFieldValues(scope, ownerId)
}

export function initCustomFields(): void {
  handle('customFields:list', z.tuple([customFieldListOptions]), (_, options) =>
    listCustomFields(options)
  )
  handle('customFields:create', z.tuple([customFieldInput]), (_, input) => createCustomField(input))
  handle('customFields:rename', z.tuple([id, name]), (_, fieldId, newName) =>
    renameCustomField(fieldId, newName)
  )
  handle('customFields:setArchived', z.tuple([id, z.boolean()]), (_, fieldId, archived) =>
    setCustomFieldArchived(fieldId, archived)
  )
  handle('customFields:delete', z.tuple([id]), (_, fieldId) => deleteCustomField(fieldId))
  handle('customFields:createOption', z.tuple([id, name]), (_, fieldId, optionName) =>
    createCustomFieldOption(fieldId, optionName)
  )
  handle('customFields:renameOption', z.tuple([id, name]), (_, optionId, newName) =>
    renameCustomFieldOption(optionId, newName)
  )
  handle('customFields:setOptionArchived', z.tuple([id, z.boolean()]), (_, optionId, archived) =>
    setCustomFieldOptionArchived(optionId, archived)
  )
  handle('customFields:deleteOption', z.tuple([id]), (_, optionId) =>
    deleteCustomFieldOption(optionId)
  )
  handle('customFields:values', z.tuple([customFieldScope, id]), (_, scope, ownerId) =>
    getFieldValues(scope, ownerId)
  )
  handle(
    'customFields:setValues',
    z.tuple([customFieldScope, id, z.array(fieldValueInput)]),
    (_, scope, ownerId, values) => setFieldValues(scope, ownerId, values)
  )
}
