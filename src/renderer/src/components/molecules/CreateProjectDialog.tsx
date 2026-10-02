import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../../shared/projects'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { PROJECT_COLORS } from '../../lib/projectColors'
import { Button } from '../atoms/Button'
import { ColorSwatchPicker } from '../atoms/ColorSwatchPicker'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'

interface CreateProjectDialogProps {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
  readonly defaultColor: string
  readonly onCreated: (project: Project) => void
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  defaultColor,
  onCreated
}: CreateProjectDialogProps): React.JSX.Element {
  const t = useTranslations('CreateProjectDialog')
  const errorMessage = useErrorMessage()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [chosenColor, setChosenColor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const color = chosenColor ?? defaultColor

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setName('')
      setDescription('')
      setChosenColor(null)
      setError(null)
    }
    onOpenChange(open)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const project = await api.projects.create({ name, description, color })
      onCreated(project)
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
            <DialogHeading>{t('title')}</DialogHeading>
            <TextField
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <TextField
              label={t('descriptionLabel')}
              value={description}
              onChange={setDescription}
            />
            <ColorSwatchPicker
              label={t('colorLabel')}
              colors={PROJECT_COLORS}
              value={color}
              onChange={(value) => setChosenColor(value.toString('hex').toLowerCase())}
            />
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
