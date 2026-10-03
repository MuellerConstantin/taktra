import { useEffect, useState } from 'react'
import { Form, useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Activity } from '../../../../shared/activities'
import type { Project } from '../../../../shared/projects'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { useTimer } from '../../hooks/useTimer'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { ComboBox, ComboBoxItem } from '../atoms/ComboBox'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { Select, SelectItem } from '../atoms/Select'
import { MAX_NAME_LENGTH } from '../../../../shared/validation/limits'

interface ActivityOption {
  readonly id: number | 'new'
  readonly name: string
}

interface StartTimerDialogProps {
  readonly onClose: () => void
}

export function StartTimerDialog({ onClose }: StartTimerDialogProps): React.JSX.Element {
  const t = useTranslations('StartTimerDialog')
  const errorMessage = useErrorMessage()
  const { start } = useTimer()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [activities, setActivities] = useState<readonly Activity[]>([])
  const [activityName, setActivityName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const { contains } = useFilter({ sensitivity: 'base' })

  useEffect(() => {
    api.projects
      .list()
      .then(setProjects)
      .catch((caught) => setError(errorMessage(caught)))
  }, [errorMessage])

  useEffect(() => {
    if (projectId === null) return
    let isCurrent = true
    api.activities
      .list({ projectId })
      .then((result) => isCurrent && setActivities(result))
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [projectId, errorMessage])

  const trimmedName = activityName.trim()
  const existingActivity = activities.find(
    (activity) => activity.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
  )
  const matchingActivities = existingActivity
    ? activities
    : activities.filter((activity) => contains(activity.name, trimmedName))
  const activityOptions: readonly ActivityOption[] =
    trimmedName && !existingActivity
      ? [...matchingActivities, { id: 'new', name: trimmedName }]
      : matchingActivities

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (projectId === null || !trimmedName) return

    setPending(true)
    try {
      const activity =
        existingActivity ?? (await api.activities.create({ projectId, name: trimmedName }))
      await start(activity.id)
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
            <DialogHeading>{t('title')}</DialogHeading>
            <Select
              label={t('projectLabel')}
              placeholder={t('projectPlaceholder')}
              items={projects}
              value={projectId}
              onChange={(key) => {
                setProjectId(typeof key === 'number' ? key : null)
                setActivities([])
                setActivityName('')
              }}
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
            <ComboBox
              label={t('activityLabel')}
              items={activityOptions}
              inputValue={activityName}
              onInputChange={setActivityName}
              allowsCustomValue
              maxLength={MAX_NAME_LENGTH}
              allowsEmptyCollection
              isRequired
              isDisabled={projectId === null}
            >
              {(option) => (
                <ComboBoxItem id={option.id} textValue={option.name}>
                  {option.id === 'new' ? t('createActivity', { name: option.name }) : option.name}
                </ComboBoxItem>
              )}
            </ComboBox>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {t('start')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
