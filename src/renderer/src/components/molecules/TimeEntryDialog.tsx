import {
  getLocalTimeZone,
  toCalendarDateTime,
  type CalendarDate,
  type Time
} from '@internationalized/date'
import { useEffect, useState } from 'react'
import { Form, useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Activity } from '../../../../shared/activities'
import type { Project } from '../../../../shared/projects'
import type { TimeEntryTimes } from '../../../../shared/timeEntries'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { ComboBox, ComboBoxItem } from '../atoms/ComboBox'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
import { TimeField } from '../atoms/TimeField'
import { ToggleButton } from '../atoms/ToggleButton'
import { ToggleButtonGroup } from '../atoms/ToggleButtonGroup'

type Mode = 'range' | 'duration'

interface ActivityOption {
  readonly id: number | 'new'
  readonly name: string
}

interface TimeEntryDialogProps {
  readonly date: CalendarDate
  readonly onClose: () => void
  readonly onSaved: () => void
}

export function TimeEntryDialog({
  date,
  onClose,
  onSaved
}: TimeEntryDialogProps): React.JSX.Element {
  const t = useTranslations('TimeEntryDialog')
  const errorMessage = useErrorMessage()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [activities, setActivities] = useState<readonly Activity[]>([])
  const [activityName, setActivityName] = useState('')
  const [mode, setMode] = useState<Mode>('range')
  const [start, setStart] = useState<Time | null>(null)
  const [end, setEnd] = useState<Time | null>(null)
  const [duration, setDuration] = useState<Time | null>(null)
  const [note, setNote] = useState('')
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
  const matchingActivities = activities.filter((activity) => contains(activity.name, trimmedName))
  const activityOptions: readonly ActivityOption[] =
    trimmedName && !existingActivity
      ? [...matchingActivities, { id: 'new', name: trimmedName }]
      : matchingActivities

  const handleProjectChange = (key: React.Key | null): void => {
    setProjectId(typeof key === 'number' ? key : null)
    setActivities([])
    setActivityName('')
  }

  const toTimes = (): TimeEntryTimes | null => {
    if (mode === 'duration') {
      const seconds = duration ? duration.hour * 3600 + duration.minute * 60 : 0
      if (seconds <= 0) {
        setError(t('durationRequired'))
        return null
      }
      return { durationSec: seconds }
    }

    if (!start || !end) return null
    if (end.compare(start) <= 0) {
      setError(t('endBeforeStart'))
      return null
    }
    const timezone = getLocalTimeZone()
    return {
      startedAt: toCalendarDateTime(date, start).toDate(timezone),
      endedAt: toCalendarDateTime(date, end).toDate(timezone),
      timezone
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    if (projectId === null || !trimmedName) return
    const times = toTimes()
    if (!times) return

    setPending(true)
    try {
      const activity =
        existingActivity ?? (await api.activities.create({ projectId, name: trimmedName }))
      if (!existingActivity) setActivities((current) => [...current, activity])
      await api.timeEntries.create({
        activityId: activity.id,
        date: date.toString(),
        note,
        ...times
      })
      onSaved()
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
            <ComboBox
              label={t('projectLabel')}
              items={projects}
              selectedKey={projectId}
              onSelectionChange={handleProjectChange}
              isRequired
              autoFocus
            >
              {(project) => (
                <ComboBoxItem id={project.id} textValue={project.name}>
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full bg-muted"
                    style={project.color ? { backgroundColor: project.color } : undefined}
                  />
                  {project.name}
                </ComboBoxItem>
              )}
            </ComboBox>
            <ComboBox
              label={t('activityLabel')}
              items={activityOptions}
              inputValue={activityName}
              onInputChange={setActivityName}
              allowsCustomValue
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
            <ToggleButtonGroup
              aria-label={t('modeLabel')}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[mode]}
              onSelectionChange={(keys) => {
                const [selected] = keys
                if (selected === 'range' || selected === 'duration') setMode(selected)
              }}
            >
              <ToggleButton id="range" className="flex-1">
                {t('modeRange')}
              </ToggleButton>
              <ToggleButton id="duration" className="flex-1">
                {t('modeDuration')}
              </ToggleButton>
            </ToggleButtonGroup>
            {mode === 'range' ? (
              <div className="flex gap-3">
                <TimeField
                  label={t('startLabel')}
                  value={start}
                  onChange={setStart}
                  isRequired
                  className="flex-1"
                />
                <TimeField
                  label={t('endLabel')}
                  value={end}
                  onChange={setEnd}
                  isRequired
                  className="flex-1"
                />
              </div>
            ) : (
              <TimeField
                label={t('durationLabel')}
                value={duration}
                onChange={setDuration}
                hourCycle={24}
                isRequired
              />
            )}
            <TextField label={t('noteLabel')} value={note} onChange={setNote} />
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
