import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type {
  CustomField,
  CustomFieldScope,
  CustomFieldType
} from '../../../../shared/customFields'
import { MAX_NAME_LENGTH } from '../../../../shared/validation/limits'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { RadioCard, RadioGroup } from '../atoms/RadioGroup'
import { TextField } from '../atoms/TextField'

interface CustomFieldDialogProps {
  readonly scope: CustomFieldScope
  readonly field?: CustomField
  readonly onClose: () => void
  readonly onSaved: (field: CustomField) => void
}

export function CustomFieldDialog({
  scope,
  field,
  onClose,
  onSaved
}: CustomFieldDialogProps): React.JSX.Element {
  const t = useTranslations('CustomFieldDialog')
  const errorMessage = useErrorMessage()
  const [name, setName] = useState(field?.name ?? '')
  const [type, setType] = useState<CustomFieldType>(field?.type ?? 'text')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      onSaved(
        field
          ? await api.customFields.rename(field.id, name)
          : await api.customFields.create({ scope, type, name })
      )
      onClose()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <Dialog>
        {({ close }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeading>{field ? t('editTitle') : t(`scopes.${scope}`)}</DialogHeading>
            <TextField
              maxLength={MAX_NAME_LENGTH}
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            {!field && (
              <RadioGroup
                label={t('typeLabel')}
                description={t('typeDescription')}
                value={type}
                onChange={(value) => setType(value as CustomFieldType)}
              >
                <RadioCard value="text" label={t('types.text')} description={t('textHint')} />
                <RadioCard value="select" label={t('types.select')} description={t('selectHint')} />
              </RadioGroup>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {field ? t('save') : t('create')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
