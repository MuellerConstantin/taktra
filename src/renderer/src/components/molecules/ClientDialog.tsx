import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Client } from '../../../../shared/clients'
import { useCustomFieldValues } from '../../hooks/useCustomFieldValues'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
import { CustomFieldInputs } from './CustomFieldInputs'
import { MAX_NAME_LENGTH } from '../../../../shared/validation/limits'

interface ClientDialogProps {
  readonly client?: Client
  readonly onClose: () => void
  readonly onSaved: (client: Client) => void
}

export function ClientDialog({ client, onClose, onSaved }: ClientDialogProps): React.JSX.Element {
  const t = useTranslations('ClientDialog')
  const errorMessage = useErrorMessage()
  const [name, setName] = useState(client?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const fieldValues = useCustomFieldValues('client', client?.id)
  const shownError = error ?? fieldValues.error

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const input = { name }
      const saved = client
        ? await api.clients.update(client.id, input)
        : await api.clients.create(input)
      await fieldValues.save(saved.id)
      onSaved(saved)
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
            <DialogHeading>{client ? t('editTitle') : t('createTitle')}</DialogHeading>
            <TextField
              maxLength={MAX_NAME_LENGTH}
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <CustomFieldInputs values={fieldValues} />
            {shownError && <p className="text-sm text-destructive">{shownError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {client ? t('save') : t('create')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
