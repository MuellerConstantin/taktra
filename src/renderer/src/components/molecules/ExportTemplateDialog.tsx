import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { MAX_NAME_LENGTH } from '../../../../shared/validation/limits'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'

interface ExportTemplateDialogProps {
  readonly title: string
  readonly actionLabel: string
  readonly name?: string
  readonly onClose: () => void
  readonly onSave: (name: string) => Promise<void>
}

export function ExportTemplateDialog({
  title,
  actionLabel,
  name: initialName = '',
  onClose,
  onSave
}: ExportTemplateDialogProps): React.JSX.Element {
  const t = useTranslations('ExportTemplateDialog')
  const errorMessage = useErrorMessage()
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSave(name)
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
            <DialogHeading>{title}</DialogHeading>
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
                {actionLabel}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
