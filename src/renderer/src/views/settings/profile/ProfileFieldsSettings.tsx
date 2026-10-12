import {
  RiAddLine,
  RiArchiveLine,
  RiDeleteBinLine,
  RiInboxUnarchiveLine,
  RiListCheck,
  RiPencilLine
} from '@remixicon/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import {
  customFieldScopes,
  type CustomField,
  type CustomFieldScope,
  type CustomFieldWithOptions
} from '../../../../../shared/customFields'
import { MAX_ACTIVE_CUSTOM_FIELDS } from '../../../../../shared/validation/limits'
import { AlertDialog } from '../../../components/atoms/AlertDialog'
import { Button } from '../../../components/atoms/Button'
import { Modal } from '../../../components/atoms/Modal'
import { ToggleButton } from '../../../components/atoms/ToggleButton'
import { CustomFieldDialog } from '../../../components/molecules/CustomFieldDialog'
import { CustomFieldOptionsDialog } from '../../../components/molecules/CustomFieldOptionsDialog'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useProfiles } from '../../../hooks/useProfiles'
import { api } from '../../../lib/api'

interface FieldRowProps {
  readonly field: CustomFieldWithOptions
  readonly onEdit: () => void
  readonly onEditOptions: () => void
  readonly onToggleArchived: () => void
  readonly onDelete: () => void
}

function FieldRow({
  field,
  onEdit,
  onEditOptions,
  onToggleArchived,
  onDelete
}: FieldRowProps): React.JSX.Element {
  const t = useTranslations('ProfileFieldsSettings')
  const activeOptions = field.options.filter((option) => !option.archivedAt).length

  return (
    <li className="flex items-center gap-2 px-4 py-2.5">
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="truncate text-sm font-medium">{field.name}</span>
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {field.type === 'select' ? t('selectSummary', { count: activeOptions }) : t('types.text')}
        </span>
        {field.archivedAt && (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {t('archived')}
          </span>
        )}
      </span>
      {field.type === 'select' && (
        <Button
          variant="icon"
          aria-label={t('editOptions', { name: field.name })}
          onPress={onEditOptions}
        >
          <RiListCheck className="size-4" />
        </Button>
      )}
      <Button variant="icon" aria-label={t('edit', { name: field.name })} onPress={onEdit}>
        <RiPencilLine className="size-4" />
      </Button>
      <Button
        variant="icon"
        aria-label={
          field.archivedAt
            ? t('unarchive', { name: field.name })
            : t('archive', { name: field.name })
        }
        onPress={onToggleArchived}
      >
        {field.archivedAt ? (
          <RiInboxUnarchiveLine className="size-4" />
        ) : (
          <RiArchiveLine className="size-4" />
        )}
      </Button>
      <Button variant="icon" aria-label={t('delete', { name: field.name })} onPress={onDelete}>
        <RiDeleteBinLine className="size-4" />
      </Button>
    </li>
  )
}

function ProfileFieldsSettings(): React.JSX.Element {
  const t = useTranslations('ProfileFieldsSettings')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const [fields, setFields] = useState<readonly CustomFieldWithOptions[] | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [dialog, setDialog] = useState<{
    readonly scope: CustomFieldScope
    readonly field?: CustomField
  } | null>(null)
  const [optionsFieldId, setOptionsFieldId] = useState<number | null>(null)
  const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(null)

  useEffect(() => {
    let isCurrent = true
    api.customFields
      .list({ includeArchived: true })
      .then((result) => {
        if (!isCurrent) return
        setFields(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, reloadCount, errorMessage])

  const reload = (): void => setReloadCount((count) => count + 1)

  const runAction = async (action: () => Promise<unknown>): Promise<void> => {
    setActionError(null)
    try {
      await action()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
    reload()
  }

  const handleSaved = (field: CustomField): void => {
    if (!dialog?.field && field.type === 'select') setOptionsFieldId(field.id)
    reload()
  }

  const optionsField = fields?.find((field) => field.id === optionsFieldId)

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!fields) return <></>

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="min-w-0 flex-1 basis-80 text-sm text-muted-foreground">
          {t('description')}{' '}
          <Link
            href="/help/customFields"
            className="cursor-default rounded-sm text-primary underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('more')}
          </Link>
        </p>
        <ToggleButton isSelected={showArchived} onChange={setShowArchived}>
          <RiArchiveLine className="size-4" />
          {t('showArchived')}
        </ToggleButton>
      </div>
      {actionError && <p className="-mt-6 text-sm text-destructive">{actionError}</p>}
      {customFieldScopes.map((scope) => {
        const scopeFields = fields.filter((field) => field.scope === scope)
        const visibleFields = scopeFields.filter((field) => showArchived || !field.archivedAt)
        const isFull =
          scopeFields.filter((field) => !field.archivedAt).length >= MAX_ACTIVE_CUSTOM_FIELDS

        return (
          <section key={scope} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold">{t(`scopes.${scope}.title`)}</h2>
              <p className="text-sm text-muted-foreground">{t(`scopes.${scope}.description`)}</p>
            </div>
            {visibleFields.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
                {visibleFields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    onEdit={() => setDialog({ scope, field })}
                    onEditOptions={() => setOptionsFieldId(field.id)}
                    onToggleArchived={() =>
                      runAction(() => api.customFields.setArchived(field.id, !field.archivedAt))
                    }
                    onDelete={() => setFieldToDelete(field)}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" isDisabled={isFull} onPress={() => setDialog({ scope })}>
                <RiAddLine className="size-4" />
                {t('create')}
              </Button>
              {isFull && (
                <span className="text-sm text-muted-foreground">
                  {t('limit', { max: MAX_ACTIVE_CUSTOM_FIELDS })}
                </span>
              )}
            </div>
          </section>
        )
      })}
      {dialog && (
        <CustomFieldDialog
          scope={dialog.scope}
          field={dialog.field}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}
      {optionsField && (
        <CustomFieldOptionsDialog
          field={optionsField}
          onClose={() => setOptionsFieldId(null)}
          onChanged={reload}
        />
      )}
      <Modal
        isOpen={fieldToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setFieldToDelete(null)}
        isDismissable
      >
        {fieldToDelete && (
          <AlertDialog
            variant="destructive"
            title={t('deleteConfirmTitle', { name: fieldToDelete.name })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() => runAction(() => api.customFields.delete(fieldToDelete.id))}
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default ProfileFieldsSettings
