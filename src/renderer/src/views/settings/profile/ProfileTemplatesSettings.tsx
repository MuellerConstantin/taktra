import { RiDeleteBinLine, RiDownload2Line, RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-aria-components'
import { useNavigate } from 'react-router'
import { useTranslations } from 'use-intl'
import type { ExportTemplate } from '../../../../../shared/export'
import { AlertDialog } from '../../../components/atoms/AlertDialog'
import { Button } from '../../../components/atoms/Button'
import { Modal } from '../../../components/atoms/Modal'
import { ExportTemplateDialog } from '../../../components/molecules/ExportTemplateDialog'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useProfiles } from '../../../hooks/useProfiles'
import { api } from '../../../lib/api'

function ProfileTemplatesSettings(): React.JSX.Element {
  const t = useTranslations('ProfileTemplatesSettings')
  const tExport = useTranslations('ExportView')
  const errorMessage = useErrorMessage()
  const navigate = useNavigate()
  const { activeProfile } = useProfiles()
  const [templates, setTemplates] = useState<readonly ExportTemplate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [templateToRename, setTemplateToRename] = useState<ExportTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<ExportTemplate | null>(null)

  useEffect(() => {
    let isCurrent = true
    api.exportTemplates
      .list()
      .then((result) => {
        if (!isCurrent) return
        setTemplates(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, reloadCount, errorMessage])

  const reload = (): void => setReloadCount((count) => count + 1)

  const rename = async (template: ExportTemplate, name: string): Promise<void> => {
    const { format, layout, columns } = template
    await api.exportTemplates.update(template.id, { name, format, layout, columns: [...columns] })
    reload()
  }

  const remove = async (template: ExportTemplate): Promise<void> => {
    setActionError(null)
    try {
      await api.exportTemplates.delete(template.id)
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
    reload()
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!templates) return <></>

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {t('description')}{' '}
        <Link
          href="/help/export"
          className="cursor-default rounded-sm text-primary underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('more')}
        </Link>
      </p>
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {templates.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {templates.map((template) => (
            <li key={template.id} className="flex items-center gap-2 px-4 py-2.5">
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-sm font-medium">{template.name}</span>
                <span className="text-sm whitespace-nowrap text-muted-foreground">
                  {t('summary', {
                    format: template.format.toUpperCase(),
                    layout: tExport(`layouts.${template.layout}`),
                    count: template.columns.length
                  })}
                </span>
              </span>
              <Button
                variant="icon"
                aria-label={t('open', { name: template.name })}
                onPress={() => navigate(`/export?template=${template.id}`)}
              >
                <RiDownload2Line className="size-4" />
              </Button>
              <Button
                variant="icon"
                aria-label={t('rename', { name: template.name })}
                onPress={() => setTemplateToRename(template)}
              >
                <RiPencilLine className="size-4" />
              </Button>
              <Button
                variant="icon"
                aria-label={t('delete', { name: template.name })}
                onPress={() => setTemplateToDelete(template)}
              >
                <RiDeleteBinLine className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      )}
      {templateToRename && (
        <ExportTemplateDialog
          title={t('renameTitle')}
          actionLabel={t('renameAction')}
          name={templateToRename.name}
          onClose={() => setTemplateToRename(null)}
          onSave={(name) => rename(templateToRename, name)}
        />
      )}
      <Modal
        isOpen={templateToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setTemplateToDelete(null)}
        isDismissable
      >
        {templateToDelete && (
          <AlertDialog
            variant="destructive"
            title={t('deleteConfirmTitle', { name: templateToDelete.name })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() => remove(templateToDelete)}
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default ProfileTemplatesSettings
