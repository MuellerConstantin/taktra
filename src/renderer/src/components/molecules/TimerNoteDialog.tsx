import { useState } from 'react'
import { Form } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import { NoteField } from './NoteField'

interface TimerNoteDialogProps {
  readonly entryId: number
  readonly note: string | null
  readonly onClose: () => void
}

export function TimerNoteDialog({
  entryId,
  note: initialNote,
  onClose
}: TimerNoteDialogProps): React.JSX.Element {
  const t = useTranslations('TimerNoteDialog')
  const errorMessage = useErrorMessage()
  const [note, setNote] = useState(initialNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await api.timeEntries.setNote(entryId, note)
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
            <NoteField value={note} onChange={setNote} rows={8} autoFocus />
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
