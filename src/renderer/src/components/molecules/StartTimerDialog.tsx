import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityWithTags } from '../../../../shared/activities'
import { normalizeName } from '../../../../shared/names'
import type { Project } from '../../../../shared/projects'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { useTimer } from '../../hooks/useTimer'
import { findActivityByName } from '../../lib/activities'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { Select, SelectItem } from '../atoms/Select'
import { ActivityComboBox } from './ActivityComboBox'
import { NoteField } from './NoteField'

interface StartTimerDialogProps {
  readonly onClose: () => void
}

export function StartTimerDialog({ onClose }: StartTimerDialogProps): React.JSX.Element {
  const t = useTranslations('StartTimerDialog')
  const errorMessage = useErrorMessage()
  const { start } = useTimer()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [activities, setActivities] = useState<readonly ActivityWithTags[]>([])
  const [activityName, setActivityName] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  useEffect(() => {
    Promise.all([api.projects.list(), api.activities.list({ includeArchived: true })])
      .then(([projectList, activityList]) => {
        setProjects(projectList)
        setActivities(activityList)
      })
      .catch((caught) => setError(errorMessage(caught)))
  }, [errorMessage])

  const trimmedName = normalizeName(activityName)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (projectId === null || !trimmedName) return

    setPending(true)
    try {
      const existing = findActivityByName(activities, projectId, trimmedName)
      if (existing?.archivedAt) await api.activities.setArchived(existing.id, false)
      const activity = existing ?? (await api.activities.create({ projectId, name: trimmedName }))
      await start(activity.id, note)
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
            <ActivityComboBox
              label={t('activityLabel')}
              activities={activities}
              projects={projects}
              projectId={projectId}
              value={activityName}
              onChange={setActivityName}
              onSelect={(activity) => setProjectId(activity.projectId)}
            />
            <NoteField value={note} onChange={setNote} rows={3} />
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
