import {
  RiAddLine,
  RiArchiveLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiInboxUnarchiveLine,
  RiPencilLine
} from '@remixicon/react'
import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { CustomFieldOption, CustomFieldWithOptions } from '../../../../shared/customFields'
import { MAX_ACTIVE_FIELD_OPTIONS, MAX_NAME_LENGTH } from '../../../../shared/validation/limits'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'

interface CustomFieldOptionsDialogProps {
  readonly field: CustomFieldWithOptions
  readonly onClose: () => void
  readonly onChanged: () => void
}

export function CustomFieldOptionsDialog({
  field,
  onClose,
  onChanged
}: CustomFieldOptionsDialogProps): React.JSX.Element {
  const t = useTranslations('CustomFieldOptionsDialog')
  const errorMessage = useErrorMessage()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ readonly id: number; readonly name: string } | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const activeCount = field.options.filter((option) => !option.archivedAt).length
  const isFull = activeCount >= MAX_ACTIVE_FIELD_OPTIONS

  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setPending(true)
    setError(null)
    try {
      await action()
      onChanged()
      return true
    } catch (caught) {
      setError(errorMessage(caught))
      return false
    } finally {
      setPending(false)
    }
  }

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (await run(() => api.customFields.createOption(field.id, newName))) setNewName('')
  }

  const handleRename = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!editing) return
    if (await run(() => api.customFields.renameOption(editing.id, editing.name))) setEditing(null)
  }

  const renderOption = (option: CustomFieldOption): React.JSX.Element =>
    editing?.id === option.id ? (
      <Form onSubmit={handleRename} className="flex items-center gap-2 py-1.5">
        <TextField
          aria-label={t('nameLabel')}
          maxLength={MAX_NAME_LENGTH}
          value={editing.name}
          onChange={(name) => setEditing({ id: option.id, name })}
          isRequired
          autoFocus
          className="min-w-0 flex-1"
        />
        <Button variant="icon" type="submit" aria-label={t('save')} isDisabled={isPending}>
          <RiCheckLine className="size-4" />
        </Button>
        <Button variant="icon" aria-label={t('cancel')} onPress={() => setEditing(null)}>
          <RiCloseLine className="size-4" />
        </Button>
      </Form>
    ) : (
      <div className="flex items-center gap-2 py-1.5">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm">{option.name}</span>
          {option.archivedAt && (
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {t('archived')}
            </span>
          )}
        </span>
        <Button
          variant="icon"
          aria-label={t('rename', { name: option.name })}
          onPress={() => setEditing({ id: option.id, name: option.name })}
        >
          <RiPencilLine className="size-4" />
        </Button>
        <Button
          variant="icon"
          aria-label={
            option.archivedAt
              ? t('unarchive', { name: option.name })
              : t('archive', { name: option.name })
          }
          isDisabled={isPending}
          onPress={() =>
            run(() => api.customFields.setOptionArchived(option.id, !option.archivedAt))
          }
        >
          {option.archivedAt ? (
            <RiInboxUnarchiveLine className="size-4" />
          ) : (
            <RiArchiveLine className="size-4" />
          )}
        </Button>
        <Button
          variant="icon"
          aria-label={t('delete', { name: option.name })}
          isDisabled={isPending}
          onPress={() => run(() => api.customFields.deleteOption(option.id))}
        >
          <RiDeleteBinLine className="size-4" />
        </Button>
      </div>
    )

  return (
    <Modal isOpen onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <Dialog>
        {({ close }) => (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <DialogHeading>{t('title', { name: field.name })}</DialogHeading>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
            {field.options.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {field.options.map((option) => (
                  <li key={option.id}>{renderOption(option)}</li>
                ))}
              </ul>
            )}
            <Form onSubmit={handleAdd} className="flex items-start gap-2">
              <TextField
                aria-label={t('newLabel')}
                placeholder={t('newLabel')}
                maxLength={MAX_NAME_LENGTH}
                value={newName}
                onChange={setNewName}
                isDisabled={isFull}
                autoFocus
                className="min-w-0 flex-1"
              />
              <Button
                type="submit"
                variant="secondary"
                isDisabled={isPending || isFull || !newName.trim()}
              >
                <RiAddLine className="size-4" />
                {t('add')}
              </Button>
            </Form>
            {isFull && (
              <p className="text-sm text-muted-foreground">
                {t('limit', { max: MAX_ACTIVE_FIELD_OPTIONS })}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button onPress={close}>{t('done')}</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Modal>
  )
}
