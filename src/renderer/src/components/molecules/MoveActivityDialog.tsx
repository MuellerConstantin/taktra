import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../../shared/activities'
import type { Client } from '../../../../shared/clients'
import type { Project } from '../../../../shared/projects'
import { MAX_NAME_LENGTH } from '../../../../shared/validation/limits'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { Select, SelectItem } from '../atoms/Select'
import { TextField } from '../atoms/TextField'

interface MoveActivityDialogProps {
  readonly activity: ActivityRef
  readonly onClose: () => void
  readonly onMoved: () => void
}

export function MoveActivityDialog({
  activity,
  onClose,
  onMoved
}: MoveActivityDialogProps): React.JSX.Element {
  const t = useTranslations('MoveActivityDialog')
  const errorMessage = useErrorMessage()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [clients, setClients] = useState<readonly Client[]>([])
  const [currentClientId, setCurrentClientId] = useState<number | null>(null)
  const [name, setName] = useState(activity.name)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const targetClientId = projects.find((project) => project.id === projectId)?.clientId ?? null
  const clientName = (id: number): string => clients.find((client) => client.id === id)?.name ?? ''

  useEffect(() => {
    Promise.all([
      api.projects.list(),
      api.clients.list({ includeArchived: true }),
      api.projects.get(activity.projectId),
      api.activities.list({ projectId: activity.projectId, includeArchived: true })
    ])
      .then(([list, loadedClients, source, activities]) => {
        setProjects(list.filter((project) => project.id !== activity.projectId))
        setClients(loadedClients)
        setCurrentClientId(
          source.clientId ?? activities.find((other) => other.id === activity.id)?.clientId ?? null
        )
      })
      .catch((caught) => setError(errorMessage(caught)))
  }, [activity.id, activity.projectId, errorMessage])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (projectId === null) return
    setPending(true)
    setError(null)
    try {
      await api.activities.move(activity.id, projectId, name)
      onMoved()
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
            <DialogHeading>{t('title', { name: activity.name })}</DialogHeading>
            <Select
              label={t('projectLabel')}
              placeholder={t('projectPlaceholder')}
              search={{ label: t('searchProjects'), empty: t('noProjects') }}
              items={projects}
              value={projectId}
              onChange={(key) => setProjectId(typeof key === 'number' ? key : null)}
              isRequired
              autoFocus
            >
              {(project) => (
                <SelectItem id={project.id} textValue={project.name}>
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full bg-muted"
                    style={project.color ? { backgroundColor: project.color } : undefined}
                  />
                  {project.name}
                </SelectItem>
              )}
            </Select>
            <TextField
              maxLength={MAX_NAME_LENGTH}
              label={t('nameLabel')}
              description={t('nameDescription')}
              value={name}
              onChange={setName}
              isRequired
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <p className="text-sm text-muted-foreground">{t('hint')}</p>
            {targetClientId !== null &&
              currentClientId !== null &&
              targetClientId !== currentClientId && (
                <p className="text-sm text-destructive">
                  {t('clientReplaced', {
                    from: clientName(currentClientId),
                    to: clientName(targetClientId)
                  })}
                </p>
              )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending || projectId === null}>
                {t('move')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
