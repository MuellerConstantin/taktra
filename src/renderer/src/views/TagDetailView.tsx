import { RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../shared/activities'
import type { AggregateRow } from '../../../shared/reports'
import type { Tag } from '../../../shared/tags'
import { Button } from '../components/atoms/Button'
import {
  Disclosure,
  DisclosureGroup,
  DisclosureHeader,
  DisclosurePanel
} from '../components/atoms/Disclosure'
import { ActivityDialog } from '../components/molecules/ActivityDialog'
import { TagBadges } from '../components/molecules/TagBadges'
import { TagDialog } from '../components/molecules/TagDialog'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { api } from '../lib/api'
import { suggestColor } from '../lib/colors'
import { formatDuration } from '../lib/duration'
import { allTime, periodFilter, type Period } from '../lib/period'

interface ProjectGroup {
  readonly project: NonNullable<AggregateRow['project']>
  readonly totalSec: number
  readonly rows: readonly (AggregateRow & { readonly activity: ActivityRef })[]
}

function groupByProject(rows: readonly AggregateRow[]): ProjectGroup[] {
  const groups = new Map<number, ProjectGroup>()
  for (const row of rows) {
    const { project, activity } = row
    if (!project || !activity) continue
    const group = groups.get(project.id) ?? { project, totalSec: 0, rows: [] }
    groups.set(project.id, {
      project,
      totalSec: group.totalSec + row.totalSec,
      rows: [...group.rows, { ...row, activity }]
    })
  }
  return [...groups.values()]
}

function TagDetailView(): React.JSX.Element {
  const t = useTranslations('TagDetailView')
  const errorMessage = useErrorMessage()
  const tagId = Number(useParams().tagId)
  const [tag, setTag] = useState<Tag | null>(null)
  const [rows, setRows] = useState<readonly AggregateRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [isTagDialogOpen, setTagDialogOpen] = useState(false)
  const [activityToEdit, setActivityToEdit] = useState<ActivityRef | null>(null)
  const [period, setPeriod] = useState<Period>(allTime)
  const { from, to } = periodFilter(period)

  const reload = (): void => setReloadCount((count) => count + 1)
  const groups = groupByProject(rows ?? [])
  const total = groups.reduce((sum, group) => sum + group.totalSec, 0)

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.tags.get(tagId),
      api.reports.aggregate({ tagIds: [tagId], from, to }, ['project', 'activity'])
    ])
      .then(([loadedTag, loadedRows]) => {
        if (!isCurrent) return
        setTag(loadedTag)
        setRows(loadedRows)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [tagId, from, to, reloadCount, errorMessage])

  if (error) return <p className="p-8 text-sm text-destructive">{error}</p>
  if (!tag || !rows) return <div />

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full bg-muted"
              style={tag.color ? { backgroundColor: tag.color } : undefined}
            />
            <span className="line-clamp-2 break-words" title={tag.name}>
              {tag.name}
            </span>
          </span>
        }
        subtitle={t('subtitle')}
        actions={
          <Button variant="secondary" onPress={() => setTagDialogOpen(true)}>
            <RiPencilLine className="size-4" />
            {t('edit')}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 pb-4">
          <span className="text-sm text-muted-foreground">
            {t('total', { duration: formatDuration(total) })}
          </span>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </ViewHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {period.range ? t('emptyPeriod') : t('empty')}
          </p>
        )}
        <DisclosureGroup allowsMultipleExpanded>
          {groups.map(({ project, totalSec, rows: projectRows }) => (
            <Disclosure key={project.id} id={project.id} className="border-b border-border">
              <DisclosureHeader className="px-8 py-3">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full bg-muted"
                  style={project.color ? { backgroundColor: project.color } : undefined}
                />
                <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
                <span className="text-muted-foreground">
                  {t('activityCount', { count: projectRows.length })}
                </span>
                <span className="w-14 text-right font-medium tabular-nums">
                  {formatDuration(totalSec)}
                </span>
                <span aria-hidden className="w-6" />
              </DisclosureHeader>
              <DisclosurePanel>
                {projectRows.map(({ activity, totalSec: activitySec, entryCount }) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 border-t border-border py-3 pr-8 pl-21 text-sm"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{activity.name}</span>
                      {activity.tags.length > 1 && (
                        <TagBadges
                          tags={activity.tags.filter((other) => other.id !== tag.id)}
                          className="mt-2"
                        />
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {t('entryCount', { count: entryCount })}
                    </span>
                    <span className="w-14 text-right tabular-nums">
                      {formatDuration(activitySec)}
                    </span>
                    <Button
                      variant="icon"
                      aria-label={t('editActivity', { name: activity.name })}
                      onPress={() => setActivityToEdit(activity)}
                    >
                      <RiPencilLine className="size-4" />
                    </Button>
                  </div>
                ))}
              </DisclosurePanel>
            </Disclosure>
          ))}
        </DisclosureGroup>
      </div>
      {isTagDialogOpen && (
        <TagDialog
          tag={tag}
          defaultColor={tag.color ?? suggestColor([])}
          onClose={() => setTagDialogOpen(false)}
          onSaved={reload}
        />
      )}
      {activityToEdit && (
        <ActivityDialog
          activity={activityToEdit}
          onClose={() => setActivityToEdit(null)}
          onSaved={reload}
        />
      )}
    </div>
  )
}

export default TagDetailView
