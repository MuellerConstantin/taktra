import { useEffect, useState } from 'react'
import type {
  CustomFieldScope,
  CustomFieldWithOptions,
  FieldValue
} from '../../../../shared/customFields'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'

interface CustomFieldValueListProps {
  readonly scope: CustomFieldScope
  readonly ownerId: number
  /** Changes whenever the owner may have been edited, so the values are loaded again. */
  readonly revision: number
}

function displayValue(field: CustomFieldWithOptions, value: FieldValue): string | null {
  if (field.type === 'text') return value.textValue
  return field.options.find((option) => option.id === value.optionId)?.name ?? null
}

/** The values of the active fields, as compact "name: value" items for a detail header. */
export function CustomFieldValueList({
  scope,
  ownerId,
  revision
}: CustomFieldValueListProps): React.JSX.Element | null {
  const errorMessage = useErrorMessage()
  const [items, setItems] = useState<
    readonly { readonly id: number; readonly name: string; readonly value: string }[]
  >([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    Promise.all([api.customFields.list({ scope }), api.customFields.values(scope, ownerId)])
      .then(([fields, values]) => {
        if (!isCurrent) return
        const byField = new Map(values.map((value) => [value.fieldId, value]))
        setItems(
          fields.flatMap((field) => {
            const stored = byField.get(field.id)
            const value = stored && displayValue(field, stored)
            return value ? [{ id: field.id, name: field.name, value }] : []
          })
        )
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [scope, ownerId, revision, errorMessage])

  if (error) return <span className="text-destructive">{error}</span>
  if (items.length === 0) return null

  return (
    <>
      {items.map(({ id, name, value }) => (
        <span key={id} className="flex min-w-0 items-center gap-1">
          <span className="shrink-0">{name}:</span>
          <span className="truncate text-foreground" title={value}>
            {value}
          </span>
        </span>
      ))}
    </>
  )
}
