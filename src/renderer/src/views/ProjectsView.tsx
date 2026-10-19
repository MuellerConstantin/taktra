import {
  RiAddLine,
  RiArchiveLine,
  RiDeleteBinLine,
  RiMoreLine,
  RiPencilLine
} from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ListLayout, Virtualizer, useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../shared/projects'
import type { AggregateRow } from '../../../shared/reports'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListChevron, GridListItem } from '../components/atoms/GridList'
import { Menu, MenuItem, MenuTrigger } from '../components/atoms/Menu'
import { Modal } from '../components/atoms/Modal'
import { SearchField } from '../components/atoms/SearchField'
import { ToggleButton } from '../components/atoms/ToggleButton'
import { ProjectDialog } from '../components/molecules/ProjectDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useShortcut } from '../hooks/useShortcut'
import { useCreateRequest } from '../hooks/useCreateRequest'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { appShortcuts } from '../lib/shortcuts'
import { suggestColor } from '../lib/colors'
import { formatDuration } from '../lib/duration'

interface ProjectTotal {
  readonly activityCount: number
  readonly totalSec: number
}

function totalsByProject(rows: readonly AggregateRow[]): ReadonlyMap<number, ProjectTotal> {
  return rows.reduce((totals, { project, totalSec }) => {
    if (!project) return totals
    const current = totals.get(project.id) ?? { activityCount: 0, totalSec: 0 }
    return totals.set(project.id, {
      activityCount: current.activityCount + 1,
      totalSec: current.totalSec + totalSec
    })
  }, new Map<number, ProjectTotal>())
}

function ProjectsView(): React.JSX.Element {
  const t = useTranslations('ProjectsView')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [projects, setProjects] = useState<readonly Project[] | null>(null)
  const [totals, setTotals] = useState<ReadonlyMap<number, ProjectTotal>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ readonly project?: Project } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })

  const visibleProjects = (projects ?? []).filter(
    (project) => contains(project.name, query) || contains(project.description ?? '', query)
  )

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      api.projects.list({ includeArchived: showArchived }),
      api.reports.aggregate({}, ['project', 'activity'])
    ])
      .then(([loadedProjects, rows]) => {
        if (!isCurrent) return
        setProjects(loadedProjects)
        setTotals(totalsByProject(rows))
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, showArchived, reloadCount, errorMessage])

  const handleDelete = async (project: Project): Promise<void> => {
    setDeleteError(null)
    try {
      await api.projects.delete(project.id)
    } catch (caught) {
      setDeleteError(errorMessage(caught))
    }
    setReloadCount((count) => count + 1)
  }

  useShortcut(appShortcuts.create, () => setDialog({}))
  useCreateRequest(() => setDialog({}))
  useShortcut(appShortcuts.search, () => searchRef.current?.focus())

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        help={t('help')}
        helpTopic="projects"
        actions={
          <Button onPress={() => setDialog({})} shortcut={appShortcuts.create}>
            <RiAddLine className="size-4" />
            {t('create')}
          </Button>
        }
      >
        <div className="flex items-center gap-2 pb-4">
          <SearchField
            inputRef={searchRef}
            aria-label={t('search')}
            placeholder={t('search')}
            value={query}
            onChange={setQuery}
            className="w-64"
          />
          <ToggleButton isSelected={showArchived} onChange={setShowArchived}>
            <RiArchiveLine className="size-4" />
            {t('showArchived')}
          </ToggleButton>
        </div>
      </ViewHeader>
      {deleteError && <p className="px-8 pt-4 text-sm text-destructive">{deleteError}</p>}
      {error && <p className="p-8 text-sm text-destructive">{error}</p>}
      {!error && projects && (
        <Virtualizer layout={ListLayout} layoutOptions={{ rowSize: 56 }}>
          <GridList
            aria-label={t('title')}
            items={visibleProjects}
            onAction={(key) => navigate(`/projects/${key}`)}
            className="min-h-0 flex-1"
            renderEmptyState={() =>
              visibleProjects.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  {query ? t('noMatches') : t('empty')}
                </p>
              )
            }
          >
            {(project) => (
              <GridListItem textValue={project.name}>
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full bg-muted"
                  style={project.color ? { backgroundColor: project.color } : undefined}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{project.name}</span>
                    {project.archivedAt && (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {t('archived')}
                      </span>
                    )}
                  </span>
                  {project.description && (
                    <span className="truncate text-xs text-muted-foreground">
                      {project.description}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {t('activityCount', { count: totals.get(project.id)?.activityCount ?? 0 })}
                </span>
                <span className="w-14 shrink-0 text-right font-medium tabular-nums">
                  {formatDuration(totals.get(project.id)?.totalSec ?? 0)}
                </span>
                <MenuTrigger placement="bottom end">
                  <Button variant="icon" aria-label={t('actions', { name: project.name })}>
                    <RiMoreLine className="size-4" />
                  </Button>
                  <Menu
                    onAction={(key) =>
                      key === 'delete' ? setProjectToDelete(project) : setDialog({ project })
                    }
                  >
                    <MenuItem id="edit">
                      <RiPencilLine aria-hidden className="size-4" />
                      {t('edit')}
                    </MenuItem>
                    <MenuItem id="delete">
                      <RiDeleteBinLine aria-hidden className="size-4" />
                      {t('delete')}
                    </MenuItem>
                  </Menu>
                </MenuTrigger>
                <GridListChevron />
              </GridListItem>
            )}
          </GridList>
        </Virtualizer>
      )}
      {dialog && (
        <ProjectDialog
          project={dialog.project}
          defaultColor={suggestColor(projects ?? [])}
          onClose={() => setDialog(null)}
          onSaved={() => setReloadCount((count) => count + 1)}
        />
      )}
      <Modal
        isOpen={projectToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setProjectToDelete(null)}
        isDismissable
      >
        {projectToDelete && (
          <AlertDialog
            variant="destructive"
            title={t('deleteConfirmTitle', { name: projectToDelete.name })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() => handleDelete(projectToDelete)}
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default ProjectsView
