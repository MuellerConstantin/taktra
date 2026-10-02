import { RiAddLine, RiArchiveLine, RiDeleteBinLine, RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ListLayout, Virtualizer, useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../shared/projects'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { SearchField } from '../components/atoms/SearchField'
import { ToggleButton } from '../components/atoms/ToggleButton'
import { ProjectDialog } from '../components/molecules/ProjectDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { suggestColor } from '../lib/colors'

function ProjectsView(): React.JSX.Element {
  const t = useTranslations('ProjectsView')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const [projects, setProjects] = useState<readonly Project[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ readonly project?: Project } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const { contains } = useFilter({ sensitivity: 'base' })

  const visibleProjects = (projects ?? []).filter(
    (project) => contains(project.name, query) || contains(project.description ?? '', query)
  )

  useEffect(() => {
    let isCurrent = true
    api.projects
      .list({ includeArchived: showArchived })
      .then((result) => {
        if (!isCurrent) return
        setProjects(result)
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

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        actions={
          <Button onPress={() => setDialog({})}>
            <RiAddLine className="size-4" />
            {t('create')}
          </Button>
        }
      >
        <div className="flex items-center gap-2 pb-4">
          <SearchField
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
                <Button
                  variant="icon"
                  aria-label={t('edit', { name: project.name })}
                  onPress={() => setDialog({ project })}
                >
                  <RiPencilLine className="size-4" />
                </Button>
                <Button
                  variant="icon"
                  aria-label={t('delete', { name: project.name })}
                  onPress={() => setProjectToDelete(project)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
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
