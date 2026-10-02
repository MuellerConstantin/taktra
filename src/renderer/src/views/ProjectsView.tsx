import { RiAddLine, RiDeleteBinLine, RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { ListLayout, Virtualizer } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../shared/projects'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { ProjectDialog } from '../components/molecules/ProjectDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { suggestProjectColor } from '../lib/projectColors'

function ProjectsView(): React.JSX.Element {
  const t = useTranslations('ProjectsView')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ readonly project?: Project } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    api.projects
      .list()
      .then((result) => {
        if (!isCurrent) return
        setProjects(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, reloadCount, errorMessage])

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
      />
      {deleteError && <p className="px-8 pt-4 text-sm text-destructive">{deleteError}</p>}
      {error ? (
        <p className="p-8 text-sm text-destructive">{error}</p>
      ) : (
        <Virtualizer layout={ListLayout} layoutOptions={{ rowSize: 56 }}>
          <GridList
            aria-label={t('title')}
            items={projects}
            className="min-h-0 flex-1"
            renderEmptyState={() => (
              <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            )}
          >
            {(project) => (
              <GridListItem textValue={project.name}>
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full bg-muted"
                  style={project.color ? { backgroundColor: project.color } : undefined}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{project.name}</span>
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
          defaultColor={suggestProjectColor(projects)}
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
