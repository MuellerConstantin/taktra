import {
  fromDate,
  getLocalTimeZone,
  toCalendarDateTime,
  toTime,
  type Time,
  type CalendarDate
} from '@internationalized/date'
import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityWithTags } from '../../../../shared/activities'
import { normalizeName } from '../../../../shared/names'
import type { Project } from '../../../../shared/projects'
import type { Tag } from '../../../../shared/tags'
import type { TimeEntryDetails, TimeEntryTimes } from '../../../../shared/timeEntries'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { findActivityByName } from '../../lib/activities'
import { api } from '../../lib/api'
import { formatDuration, parseDuration } from '../../lib/duration'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { Select, SelectItem } from '../atoms/Select'
import { TextField } from '../atoms/TextField'
import { TimeField } from '../atoms/TimeField'
import { ToggleButton } from '../atoms/ToggleButton'
import { ToggleButtonGroup } from '../atoms/ToggleButtonGroup'
import { ActivityComboBox } from './ActivityComboBox'
import { NoteField } from './NoteField'
import { TagPicker } from './TagPicker'

type Mode = 'range' | 'duration'

interface TimeEntryDialogProps {
  readonly date: CalendarDate
  readonly details?: TimeEntryDetails
  readonly onClose: () => void
  readonly onSaved: () => void
}

function toLocalTime(date: Date | null): Time | null {
  return date ? toTime(fromDate(date, getLocalTimeZone())) : null
}

export function TimeEntryDialog({
  date,
  details,
  onClose,
  onSaved
}: TimeEntryDialogProps): React.JSX.Element {
  const t = useTranslations('TimeEntryDialog')
  const errorMessage = useErrorMessage()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [projectId, setProjectId] = useState(details?.project.id ?? null)
  const [activities, setActivities] = useState<readonly ActivityWithTags[]>([])
  const [activityName, setActivityName] = useState(details?.activity.name ?? '')
  const [tags, setTags] = useState<readonly Tag[]>([])
  const [chosenTagIds, setChosenTagIds] = useState<readonly number[] | null>(null)
  const [mode, setMode] = useState<Mode>(details && !details.entry.startedAt ? 'duration' : 'range')
  const [start, setStart] = useState(() => toLocalTime(details?.entry.startedAt ?? null))
  const [end, setEnd] = useState(() => toLocalTime(details?.entry.endedAt ?? null))
  const [duration, setDuration] = useState(() =>
    details && !details.entry.startedAt && details.entry.durationSec
      ? formatDuration(details.entry.durationSec)
      : ''
  )
  const [note, setNote] = useState(details?.entry.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  useEffect(() => {
    Promise.all([
      api.projects.list(),
      api.activities.list({ includeArchived: true }),
      api.tags.list()
    ])
      .then(([projectList, activityList, tagList]) => {
        setProjects(projectList)
        setActivities(activityList)
        setTags(tagList)
      })
      .catch((caught) => setError(errorMessage(caught)))
  }, [errorMessage])

  const trimmedName = normalizeName(activityName)
  const existingActivity = findActivityByName(activities, projectId, trimmedName)
  const isNewActivity = trimmedName !== '' && !existingActivity

  const handleProjectChange = (key: React.Key | null): void => {
    setProjectId(typeof key === 'number' ? key : null)
    setActivityName('')
    setChosenTagIds(null)
  }

  const toTimes = (): TimeEntryTimes | null => {
    if (mode === 'duration') {
      const seconds = parseDuration(duration)
      return seconds === null ? null : { durationSec: seconds }
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
      if (existingActivity?.archivedAt && existingActivity.id !== details?.activity.id)
        await api.activities.setArchived(existingActivity.id, false)
      const activity =
        existingActivity ?? (await api.activities.create({ projectId, name: trimmedName }))
      if (!existingActivity) setActivities((current) => [...current, { ...activity, tagIds: [] }])
      if (!existingActivity && chosenTagIds && chosenTagIds.length > 0)
        await api.activities.setTags(activity.id, chosenTagIds)
      const input = { activityId: activity.id, date: date.toString(), note, ...times }
      if (details) await api.timeEntries.update(details.entry.id, input)
      else await api.timeEntries.create(input)
      onSaved()
      onClose()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal size="wide" isOpen onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <Dialog>
        {({ close }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeading>{details ? t('editTitle') : t('title')}</DialogHeading>
            <Select
              label={t('projectLabel')}
              placeholder={t('projectPlaceholder')}
              items={projects}
              value={projectId}
              onChange={handleProjectChange}
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
              onSelect={(activity) => {
                setProjectId(activity.projectId)
                setChosenTagIds(null)
              }}
            />
            {isNewActivity && (
              <TagPicker
                tags={tags}
                value={chosenTagIds ?? []}
                onChange={setChosenTagIds}
                description={t('newActivityTags', { name: trimmedName })}
              />
            )}
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
              <TextField
                label={t('durationLabel')}
                description={t('durationDescription')}
                value={duration}
                onChange={setDuration}
                isRequired
                validate={(value) => (parseDuration(value) === null ? t('durationInvalid') : null)}
              />
            )}
            <NoteField value={note} onChange={setNote} rows={8} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {details ? t('save') : t('create')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
