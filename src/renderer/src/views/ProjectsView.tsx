import { RiAddLine, RiDeleteBinLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { ListLayout, Virtualizer } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Project } from '../../../shared/projects'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { CreateProjectDialog } from '../components/molecules/CreateProjectDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'

function ProjectsView(): React.JSX.Element {
  const t = useTranslations('ProjectsView')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const [projects, setProjects] = useState<readonly Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setCreateOpen] = useState(false)
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
          <Button onPress={() => setCreateOpen(true)}>
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
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setReloadCount((count) => count + 1)}
      />
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
