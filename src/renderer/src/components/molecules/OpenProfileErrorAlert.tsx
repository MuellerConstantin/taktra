import { useTranslations } from 'use-intl'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { AlertDialog } from '../atoms/AlertDialog'
import { Modal } from '../atoms/Modal'

interface OpenProfileErrorAlertProps {
  readonly error: unknown
  readonly onClose: () => void
}

export function OpenProfileErrorAlert({
  error,
  onClose
}: OpenProfileErrorAlertProps): React.JSX.Element {
  const t = useTranslations('OpenProfileErrorAlert')
  const errorMessage = useErrorMessage()

  return (
    <Modal isOpen={error !== null} onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <AlertDialog variant="destructive" title={t('title')} actionLabel={t('ok')}>
        {errorMessage(error)}
      </AlertDialog>
    </Modal>
  )
}
