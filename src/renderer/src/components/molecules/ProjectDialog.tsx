import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityWithTags } from '../../../../shared/activities'
import type { Client } from '../../../../shared/clients'
import type { Project } from '../../../../shared/projects'
import { useCustomFieldValues } from '../../hooks/useCustomFieldValues'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { COLORS } from '../../lib/colors'
import { Button } from '../atoms/Button'
import { ColorSwatchPicker } from '../atoms/ColorSwatchPicker'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
import { ClientSelect } from './ClientSelect'
import { CustomFieldInputs } from './CustomFieldInputs'
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '../../../../shared/validation/limits'

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
  const [clientId, setClientId] = useState(project?.clientId ?? null)
  const [clients, setClients] = useState<readonly Client[]>([])
  const [activities, setActivities] = useState<readonly ActivityWithTags[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const fieldValues = useCustomFieldValues('project', project?.id)
  const shownError = error ?? fieldValues.error

  const replacedCount =
    clientId === null || clientId === project?.clientId
      ? 0
      : activities.filter(
          (activity) => activity.clientId !== null && activity.clientId !== clientId
        ).length
  const removedClient =
    clientId === null ? clients.find((client) => client.id === project?.clientId) : undefined

  useEffect(() => {
    Promise.all([
      api.clients.list({ includeArchived: true }),
      project ? api.activities.list({ projectId: project.id, includeArchived: true }) : []
    ])
      .then(([loadedClients, loadedActivities]) => {
        setClients(loadedClients)
        setActivities(loadedActivities)
      })
      .catch((caught) => setError(errorMessage(caught)))
  }, [project, errorMessage])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const input = { name, description, color, clientId }
      const saved = project
        ? await api.projects.update(project.id, input)
        : await api.projects.create(input)
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
            <div className="flex flex-col gap-2">
              <ClientSelect
                clients={clients}
                value={clientId}
                onChange={setClientId}
                description={t('clientDescription')}
              />
              {replacedCount > 0 && (
                <p className="text-sm text-destructive">
                  {t('clientReplaces', { count: replacedCount })}
                </p>
              )}
              {removedClient && activities.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('clientHandedDown', { count: activities.length, client: removedClient.name })}
                </p>
              )}
            </div>
            <CustomFieldInputs values={fieldValues} />
            <ColorSwatchPicker
              label={t('colorLabel')}
              colors={COLORS}
              value={color}
              onChange={(value) => setColor(value.toString('hex').toLowerCase())}
            />
            {shownError && <p className="text-sm text-destructive">{shownError}</p>}
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
