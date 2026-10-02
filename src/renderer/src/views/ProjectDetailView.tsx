import { RiArchiveLine, RiInboxUnarchiveLine, RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../shared/activities'
import type { Project } from '../../../shared/projects'
import type { AggregateRow } from '../../../shared/reports'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { ActivityDialog } from '../components/molecules/ActivityDialog'
import { ProjectDialog } from '../components/molecules/ProjectDialog'
import { TagBadges } from '../components/molecules/TagBadges'
import { PeriodPicker } from '../components/molecules/PeriodPicker'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { api } from '../lib/api'
import { suggestColor } from '../lib/colors'
import { formatDuration } from '../lib/duration'
import { allTime, periodFilter, type Period } from '../lib/period'

function ProjectDetailView(): React.JSX.Element {
  const t = useTranslations('ProjectDetailView')
  const errorMessage = useErrorMessage()
  const projectId = Number(useParams().projectId)
  const [project, setProject] = useState<Project | null>(null)
  const [rows, setRows] = useState<readonly AggregateRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false)
  const [activityToEdit, setActivityToEdit] = useState<ActivityRef | null>(null)
  const [period, setPeriod] = useState<Period>(allTime)
  const { from, to } = periodFilter(period)

  const reload = (): void => setReloadCount((count) => count + 1)
  const total = (rows ?? []).reduce((sum, row) => sum + row.totalSec, 0)
  const activities = (rows ?? []).flatMap(({ activity, totalSec, entryCount }) =>
    activity ? [{ id: activity.id, activity, totalSec, entryCount }] : []
  )

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.projects.get(projectId),
      api.reports.aggregate({ projectIds: [projectId], from, to }, ['activity'])
    ])
      .then(([loadedProject, loadedRows]) => {
        if (!isCurrent) return
        setProject(loadedProject)
        setRows(loadedRows)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [projectId, from, to, reloadCount, errorMessage])

  const toggleArchived = async (): Promise<void> => {
    if (!project) return
    setActionError(null)
    try {
      await api.projects.setArchived(project.id, !project.archivedAt)
      reload()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
  }

  if (error) return <p className="p-8 text-sm text-destructive">{error}</p>
  if (!project || !rows) return <div />

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full bg-muted"
              style={project.color ? { backgroundColor: project.color } : undefined}
            />
            {project.name}
          </span>
        }
        subtitle={t('subtitle')}
        actions={
          <>
            <Button variant="secondary" onPress={toggleArchived}>
              {project.archivedAt ? (
                <RiInboxUnarchiveLine className="size-4" />
              ) : (
                <RiArchiveLine className="size-4" />
              )}
              {project.archivedAt ? t('unarchive') : t('archive')}
            </Button>
            <Button variant="secondary" onPress={() => setProjectDialogOpen(true)}>
              <RiPencilLine className="size-4" />
              {t('edit')}
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            {project.archivedAt && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                {t('archived')}
              </span>
            )}
            <span className="truncate">{project.description}</span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {t('total', { duration: formatDuration(total) })}
            </span>
            <PeriodPicker value={period} onChange={setPeriod} />
          </div>
        </div>
      </ViewHeader>
      {actionError && <p className="px-8 pt-4 text-sm text-destructive">{actionError}</p>}
      <GridList
        aria-label={t('activities')}
        items={activities}
        className="min-h-0 flex-1"
        renderEmptyState={() =>
          activities.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {period.range ? t('emptyPeriod') : t('empty')}
            </p>
          )
        }
      >
        {({ activity, totalSec, entryCount }) => (
          <GridListItem textValue={activity.name} className="h-auto">
            <div className="flex min-w-0 flex-1 flex-col py-3">
              <span className="truncate font-medium">{activity.name}</span>
              {activity.tags.length > 0 && <TagBadges tags={activity.tags} className="mt-2" />}
            </div>
            <span className="text-muted-foreground">{t('entryCount', { count: entryCount })}</span>
            <span className="w-14 text-right font-medium tabular-nums">
              {formatDuration(totalSec)}
            </span>
            <Button
              variant="icon"
              aria-label={t('editActivity', { name: activity.name })}
              onPress={() => setActivityToEdit(activity)}
            >
              <RiPencilLine className="size-4" />
            </Button>
          </GridListItem>
        )}
      </GridList>
      {isProjectDialogOpen && (
        <ProjectDialog
          project={project}
          defaultColor={project.color ?? suggestColor([])}
          onClose={() => setProjectDialogOpen(false)}
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

export default ProjectDetailView
