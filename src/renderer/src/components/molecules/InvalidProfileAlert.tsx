import { useTranslations } from 'use-intl'
import { AlertDialog } from '../atoms/AlertDialog'
import { Modal } from '../atoms/Modal'

interface InvalidProfileAlertProps {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
}

export function InvalidProfileAlert({
  isOpen,
  onOpenChange
}: InvalidProfileAlertProps): React.JSX.Element {
  const t = useTranslations('InvalidProfileAlert')

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <AlertDialog variant="destructive" title={t('title')} actionLabel={t('ok')}>
        {t('text')}
      </AlertDialog>
    </Modal>
  )
}
