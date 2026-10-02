import { useTranslations } from 'use-intl'
import { useProfiles } from '../../hooks/useProfiles'
import { AlertDialog } from '../atoms/AlertDialog'
import { Modal } from '../atoms/Modal'

interface UnavailableProfileDialogProps {
  readonly path: string | null
  readonly onClose: () => void
}

export function UnavailableProfileDialog({
  path,
  onClose
}: UnavailableProfileDialogProps): React.JSX.Element {
  const t = useTranslations('UnavailableProfileDialog')
  const { removeProfile } = useProfiles()

  return (
    <Modal isOpen={path !== null} onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <AlertDialog
        title={t('title')}
        actionLabel={t('remove')}
        cancelLabel={t('cancel')}
        onAction={() => path && removeProfile(path)}
      >
        <p>{t('text')}</p>
        <p className="mt-2 font-mono text-xs break-all text-foreground">{path}</p>
      </AlertDialog>
    </Modal>
  )
}
