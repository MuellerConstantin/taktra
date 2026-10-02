import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Tag } from '../../../../shared/tags'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { COLORS } from '../../lib/colors'
import { Button } from '../atoms/Button'
import { ColorSwatchPicker } from '../atoms/ColorSwatchPicker'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { TextField } from '../atoms/TextField'

interface TagDialogProps {
  readonly tag?: Tag
  readonly defaultColor: string
  readonly onClose: () => void
  readonly onSaved: (tag: Tag) => void
}

export function TagDialog({
  tag,
  defaultColor,
  onClose,
  onSaved
}: TagDialogProps): React.JSX.Element {
  const t = useTranslations('TagDialog')
  const errorMessage = useErrorMessage()
  const [name, setName] = useState(tag?.name ?? '')
  const [color, setColor] = useState(tag?.color ?? defaultColor)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const input = { name, color }
      onSaved(tag ? await api.tags.update(tag.id, input) : await api.tags.create(input))
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
            <DialogHeading>{tag ? t('editTitle') : t('createTitle')}</DialogHeading>
            <TextField
              label={t('nameLabel')}
              value={name}
              onChange={setName}
              isRequired
              autoFocus
              validate={(value) => (value.trim() ? null : t('nameRequired'))}
            />
            <ColorSwatchPicker
              label={t('colorLabel')}
              colors={COLORS}
              value={color}
              onChange={(value) => setColor(value.toString('hex').toLowerCase())}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onPress={close}>
                {t('cancel')}
              </Button>
              <Button type="submit" isDisabled={isPending}>
                {tag ? t('save') : t('create')}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>
    </Modal>
  )
}
