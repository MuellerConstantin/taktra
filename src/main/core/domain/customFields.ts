import { and, count, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import type {
  CustomField,
  CustomFieldOption,
  CustomFieldScope,
  CustomFieldWithOptions,
  FieldValue,
  FieldValueData
} from '../../../shared/model/customFields'
import { AppError, invalidInput } from '../../../shared/model/errors'
import { toNameKey } from '../../../shared/model/names'
import { MAX_ACTIVE_CUSTOM_FIELDS, MAX_ACTIVE_FIELD_OPTIONS } from '../../../shared/model/limits'
import { customFieldInput, customFieldListOptions } from '../../../shared/validation'
import { getActiveDatabase } from '../db/database'
import { isUniqueViolation } from '../db/errors'
import {
  activityFieldValues,
  clientFieldValues,
  customFieldOptions,
  customFields,
  projectFieldValues
} from '../db/schema'
import { findActivity } from './activities'
import { findClient } from './clients'
import { sortByName } from './names'
import { findProject } from './projects'

export const customFieldSelection = {
  id: customFields.id,
  scope: customFields.scope,
  type: customFields.type,
  name: customFields.name,
  nameKey: customFields.nameKey,
  archivedAt: customFields.archivedAt
} satisfies Record<keyof CustomField, unknown>

export const customFieldOptionSelection = {
  id: customFieldOptions.id,
  fieldId: customFieldOptions.fieldId,
  name: customFieldOptions.name,
  archivedAt: customFieldOptions.archivedAt
} satisfies Record<keyof CustomFieldOption, unknown>

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
  const field = getActiveDatabase()
    .select(customFieldSelection)
    .from(customFields)
    .where(eq(customFields.id, id))
    .get()
  if (!field) throw new AppError('CUSTOM_FIELD_NOT_FOUND', String(id))
  return field
}

function findOption(id: number): CustomFieldOption {
  const option = getActiveDatabase()
    .select(customFieldOptionSelection)
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
      .select(customFieldSelection)
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
      .select(customFieldOptionSelection)
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
      .returning(customFieldSelection)
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
      .returning(customFieldSelection)
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
    .returning(customFieldSelection)
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
  if (field.type !== 'select') throw invalidInput(['fieldId'], `Field ${fieldId} has no options`)
  assertOptionLimit(fieldId)

  try {
    return getActiveDatabase()
      .insert(customFieldOptions)
      .values({ fieldId, name, nameKey: toNameKey(name) })
      .returning(customFieldOptionSelection)
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
      .returning(customFieldOptionSelection)
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
    .returning(customFieldOptionSelection)
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

/** Values of one field as text (option names for select fields), keyed by owner id. */
export function listFieldValueTexts(field: CustomField): Map<number, string> {
  const { table, ownerId } = valueTables[field.scope]
  const rows = getActiveDatabase()
    .select({ ownerId, textValue: table.textValue, optionName: customFieldOptions.name })
    .from(table)
    .leftJoin(customFieldOptions, eq(table.optionId, customFieldOptions.id))
    .where(eq(table.fieldId, field.id))
    .all()
  return new Map(rows.map((row) => [row.ownerId, row.textValue ?? row.optionName ?? '']))
}

function assertValueAllowed(scope: CustomFieldScope, value: FieldValueData, index: number): void {
  const field = findCustomField(value.fieldId)
  if (field.scope !== scope)
    throw invalidInput([index, 'fieldId'], `Field ${field.id} does not belong to the ${scope}`)
  if (field.archivedAt) throw new AppError('CUSTOM_FIELD_ARCHIVED', String(field.id))
  if (field.type === 'text' && value.optionId !== null)
    throw invalidInput([index, 'optionId'], `Field ${field.id} takes text`)
  if (field.type === 'select' && value.textValue !== null)
    throw invalidInput([index, 'textValue'], `Field ${field.id} takes an option`)
  if (value.optionId === null) return

  const option = findOption(value.optionId)
  if (option.fieldId !== field.id)
    throw invalidInput([index, 'optionId'], `Option ${option.id} belongs to another field`)
  if (option.archivedAt) throw new AppError('CUSTOM_FIELD_OPTION_ARCHIVED', String(option.id))
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
    for (const [index, value] of values.entries()) {
      const previous = current.get(value.fieldId)
      if (
        (previous?.textValue ?? null) === value.textValue &&
        (previous?.optionId ?? null) === value.optionId
      )
        continue

      assertValueAllowed(scope, value, index)
      db.delete(table)
        .where(and(eq(ownerColumn, ownerId), eq(table.fieldId, value.fieldId)))
        .run()
      if (value.textValue !== null || value.optionId !== null) insert(ownerId, value)
    }
  })
  return selectFieldValues(scope, ownerId)
}
