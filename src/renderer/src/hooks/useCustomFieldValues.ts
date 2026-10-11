import { useEffect, useState } from 'react'
import type {
  CustomFieldScope,
  CustomFieldWithOptions,
  FieldValue,
  FieldValueInput
} from '../../../shared/customFields'
import { api } from '../lib/api'
import { useErrorMessage } from './useErrorMessage'

export interface FieldDraft {
  readonly text: string
  readonly optionId: number | null
}

export interface CustomFieldValues {
  /** The active fields of the scope. */
  readonly fields: readonly CustomFieldWithOptions[]
  readonly draftOf: (fieldId: number) => FieldDraft
  readonly setDraft: (fieldId: number, draft: FieldDraft) => void
  /** Saves the changed values; takes the owner's id because a new owner gets it only on save. */
  readonly save: (ownerId: number) => Promise<void>
  readonly error: string | null
}

function toDraft(value: FieldValue | undefined): FieldDraft {
  return { text: value?.textValue ?? '', optionId: value?.optionId ?? null }
}

export function useCustomFieldValues(scope: CustomFieldScope, ownerId?: number): CustomFieldValues {
  const [fields, setFields] = useState<readonly CustomFieldWithOptions[]>([])
  const [initial, setInitial] = useState<ReadonlyMap<number, FieldValue>>(new Map())
  const [drafts, setDrafts] = useState<ReadonlyMap<number, FieldDraft>>(new Map())
  const errorMessage = useErrorMessage()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.customFields.list({ scope }),
      ownerId === undefined ? ([] as FieldValue[]) : api.customFields.values(scope, ownerId)
    ])
      .then(([loadedFields, values]) => {
        if (!isCurrent) return
        setFields(loadedFields)
        setInitial(new Map(values.map((value) => [value.fieldId, value])))
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [scope, ownerId, errorMessage])

  const draftOf = (fieldId: number): FieldDraft =>
    drafts.get(fieldId) ?? toDraft(initial.get(fieldId))

  const setDraft = (fieldId: number, draft: FieldDraft): void =>
    setDrafts((previous) => new Map(previous).set(fieldId, draft))

  const save = async (id: number): Promise<void> => {
    const changes = fields.flatMap((field): FieldValueInput[] => {
      const draft = drafts.get(field.id)
      if (!draft) return []
      const before = toDraft(initial.get(field.id))
      if (draft.text.trim() === before.text && draft.optionId === before.optionId) return []
      return field.type === 'text'
        ? [{ fieldId: field.id, textValue: draft.text, optionId: null }]
        : [{ fieldId: field.id, textValue: null, optionId: draft.optionId }]
    })
    if (changes.length > 0) await api.customFields.setValues(scope, id, changes)
  }

  return { fields, draftOf, setDraft, save, error }
}
