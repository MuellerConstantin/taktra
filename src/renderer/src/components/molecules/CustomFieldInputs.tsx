import { useTranslations } from 'use-intl'
import { MAX_FIELD_VALUE_LENGTH } from '../../../../shared/validation/limits'
import type { CustomFieldValues } from '../../hooks/useCustomFieldValues'
import { Select, SelectItem } from '../atoms/Select'
import { TextField } from '../atoms/TextField'

const NONE = 'none'
const SEARCH_THRESHOLD = 10

interface CustomFieldInputsProps {
  readonly values: CustomFieldValues
}

export function CustomFieldInputs({ values }: CustomFieldInputsProps): React.JSX.Element {
  const t = useTranslations('CustomFieldInputs')
  const { fields, draftOf, setDraft } = values

  return (
    <>
      {fields.map((field) => {
        const draft = draftOf(field.id)
        if (field.type === 'text')
          return (
            <TextField
              key={field.id}
              label={field.name}
              maxLength={MAX_FIELD_VALUE_LENGTH}
              value={draft.text}
              onChange={(text) => setDraft(field.id, { text, optionId: null })}
            />
          )

        const options = field.options.filter(
          (option) => !option.archivedAt || option.id === draft.optionId
        )
        return (
          <Select
            key={field.id}
            label={field.name}
            search={
              options.length > SEARCH_THRESHOLD
                ? { label: t('search', { name: field.name }), empty: t('empty') }
                : undefined
            }
            items={[{ id: NONE, name: t('none') }, ...options]}
            value={draft.optionId ?? NONE}
            onChange={(key) =>
              setDraft(field.id, { text: '', optionId: typeof key === 'number' ? key : null })
            }
          >
            {(item) => (
              <SelectItem id={item.id} textValue={item.name}>
                {item.name}
              </SelectItem>
            )}
          </Select>
        )
      })}
    </>
  )
}
