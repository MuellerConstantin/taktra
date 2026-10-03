import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../../shared/projects'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { COLORS } from '../../lib/colors'
import { Button } from '../atoms/Button'
import { ColorSwatchPicker } from '../atoms/ColorSwatchPicker'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '../../../../shared/limits'

interface ProjectDialogProps {
  /** The project to edit; without one, a new project is created. */
  readonly project?: Project
  readonly defaultColor: string
  readonly onClose: () => void
  readonly onSaved: (project: Project) => void
}

export function ProjectDialog({
  project,
  defaultColor,
  onClose,
  onSaved
}: ProjectDialogProps): React.JSX.Element {
  const t = useTranslations('ProjectDialog')
  const errorMessage = useErrorMessage()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [color, setColor] = useState(project?.color ?? defaultColor)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const input = { name, description, color }
      onSaved(
        project ? await api.projects.update(project.id, input) : await api.projects.create(input)
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
            <DialogHeading>{project ? t('editTitle') : t('createTitle')}</DialogHeading>
            <TextField
              maxLength={MAX_NAME_LENGTH}
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <TextField
              maxLength={MAX_DESCRIPTION_LENGTH}
              label={t('descriptionLabel')}
              value={description}
              onChange={setDescription}
            />
            <ColorSwatchPicker
              label={t('colorLabel')}
              colors={COLORS}
              value={color}
              onChange={(value) => setColor(value.toString('hex').toLowerCase())}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {project ? t('save') : t('create')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
