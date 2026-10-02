import { useTranslations } from 'use-intl'
import { AlertDialog } from '../atoms/AlertDialog'
import { Modal } from '../atoms/Modal'

export type InvalidProfileReason = 'invalid' | 'newerVersion'

interface InvalidProfileAlertProps {
  readonly reason: InvalidProfileReason | null
  readonly onClose: () => void
}

export function InvalidProfileAlert({
  reason,
  onClose
}: InvalidProfileAlertProps): React.JSX.Element {
  const t = useTranslations('InvalidProfileAlert')
  const isNewerVersion = reason === 'newerVersion'

  return (
    <Modal isOpen={reason !== null} onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <AlertDialog
        variant="destructive"
        title={isNewerVersion ? t('newerVersionTitle') : t('title')}
        actionLabel={t('ok')}
      >
        {isNewerVersion ? t('newerVersionText') : t('text')}
      </AlertDialog>
    </Modal>
  )
}
