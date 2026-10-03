import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { useProfiles } from '../../hooks/useProfiles'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
import { MAX_NAME_LENGTH } from '../../../../shared/limits'

interface CreateProfileDialogProps {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
}

export function CreateProfileDialog({
  isOpen,
  onOpenChange
}: CreateProfileDialogProps): React.JSX.Element {
  const t = useTranslations('CreateProfileDialog')
  const { createProfile } = useProfiles()
  const errorMessage = useErrorMessage()
  const [name, setName] = useState('')
  const [defaultPath, setDefaultPath] = useState('')
  const [chosenPath, setChosenPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const path = chosenPath ?? defaultPath

  useEffect(() => {
    if (!isOpen || chosenPath) return
    api.profiles.defaultPath(name).then(setDefaultPath)
  }, [isOpen, name, chosenPath])

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setName('')
      setChosenPath(null)
      setError(null)
    }
    onOpenChange(open)
  }

  const choosePath = async (): Promise<void> => {
    const selected = await api.profiles.choosePath(path)
    if (selected) setChosenPath(selected)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await createProfile(name.trim(), path)
      handleOpenChange(false)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange} isDismissable>
      <Dialog>
        {({ close }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <DialogHeading>{t('title')}</DialogHeading>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
            <TextField
              maxLength={MAX_NAME_LENGTH}
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <div className="flex items-end gap-2">
              <TextField
                label={t('locationLabel')}
                value={path}
                isReadOnly
                className="min-w-0 flex-1"
              />
              <Button variant="secondary" onPress={choosePath}>
                {t('changeLocation')}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {t('create')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
