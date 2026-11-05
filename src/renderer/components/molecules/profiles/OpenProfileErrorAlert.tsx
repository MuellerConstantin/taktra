import { useTranslations } from 'use-intl'
import { useErrorMessage } from '@/renderer/hooks/useErrorMessage'
import { AlertDialog } from '@/renderer/components/atoms/AlertDialog'
import { Modal } from '@/renderer/components/atoms/Modal'

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
