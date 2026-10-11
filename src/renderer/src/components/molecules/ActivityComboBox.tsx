import { useMemo } from 'react'
import { useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityWithTags } from '../../../../shared/activities'
import { normalizeName } from '../../../../shared/names'
import type { Project } from '../../../../shared/projects'
import { MAX_NAME_LENGTH } from '../../../../shared/validation/limits'
import { activityOptions } from '../../lib/activities'
import { ComboBox, ComboBoxItem } from '../atoms/ComboBox'

interface ActivityComboBoxProps {
  readonly label: string
  readonly activities: readonly ActivityWithTags[]
  readonly projects: readonly Project[]
  readonly projectId: number | null
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onSelect: (activity: ActivityWithTags) => void
}

export function ActivityComboBox({
  label,
  activities,
  projects,
  projectId,
  value,
  onChange,
  onSelect
}: ActivityComboBoxProps): React.JSX.Element {
  const t = useTranslations('ActivityComboBox')
  const { contains } = useFilter({ sensitivity: 'base' })
  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects]
  )
  const options = useMemo(
    () =>
      activityOptions(
        activities,
        new Set(projectNames.keys()),
        projectId,
        normalizeName(value),
        contains
      ),
    [activities, projectNames, projectId, value, contains]
  )

  return (
    <ComboBox
      label={label}
      items={options}
      defaultFilter={() => true}
      inputValue={value}
      onInputChange={onChange}
      onSelectionChange={(key) => {
        const activity = activities.find((candidate) => candidate.id === key)
        if (activity) onSelect(activity)
      }}
      allowsCustomValue
      maxLength={MAX_NAME_LENGTH}
      allowsEmptyCollection
      isRequired
      isDisabled={projectId === null}
    >
      {(option) =>
        option.id === 'new' ? (
          <ComboBoxItem id="new" textValue={option.name}>
            {t('create', { name: option.name })}
          </ComboBoxItem>
        ) : (
          <ComboBoxItem id={option.id} textValue={option.activity.name}>
            <span className="min-w-0 truncate">
              {option.activity.name}
              {(option.activity.projectId !== projectId || option.activity.archivedAt) && (
                <span className="group-focused:text-primary-foreground/80 text-muted-foreground">
                  {option.activity.projectId !== projectId &&
                    ` · ${projectNames.get(option.activity.projectId)}`}
                  {option.activity.archivedAt && ` · ${t('archived')}`}
                </span>
              )}
            </span>
          </ComboBoxItem>
        )
      }
    </ComboBox>
  )
}
