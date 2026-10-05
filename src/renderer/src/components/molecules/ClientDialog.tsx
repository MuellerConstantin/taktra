import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Client } from '../../../../shared/clients'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const input = { name }
      onSaved(client ? await api.clients.update(client.id, input) : await api.clients.create(input))
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
            {error && <p className="text-sm text-destructive">{error}</p>}
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
