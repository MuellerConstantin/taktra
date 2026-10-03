import { useEffect, useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../../shared/activities'
import type { Tag } from '../../../../shared/tags'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'
import { TagPicker } from './TagPicker'
import { MAX_NAME_LENGTH } from '../../../../shared/limits'

interface ActivityDialogProps {
  readonly activity: ActivityRef
  readonly onClose: () => void
  readonly onSaved: () => void
}

export function ActivityDialog({
  activity,
  onClose,
  onSaved
}: ActivityDialogProps): React.JSX.Element {
  const t = useTranslations('ActivityDialog')
  const errorMessage = useErrorMessage()
  const [tags, setTags] = useState<readonly Tag[]>([])
  const [name, setName] = useState(activity.name)
  const [tagIds, setTagIds] = useState<readonly number[]>(() => activity.tags.map((tag) => tag.id))
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  useEffect(() => {
    api.tags
      .list()
      .then(setTags)
      .catch((caught) => setError(errorMessage(caught)))
  }, [errorMessage])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      if (name.trim() !== activity.name) await api.activities.rename(activity.id, name)
      const previousIds = activity.tags.map((tag) => tag.id)
      const tagsChanged =
        tagIds.length !== previousIds.length || tagIds.some((id) => !previousIds.includes(id))
      if (tagsChanged) await api.activities.setTags(activity.id, tagIds)
      onSaved()
      onClose()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal isOpen onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <Dialog>
        {({ close }) => (
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeading>{t('title')}</DialogHeading>
            <TextField
              maxLength={MAX_NAME_LENGTH}
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <TagPicker tags={tags} value={tagIds} onChange={setTagIds} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {t('save')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
