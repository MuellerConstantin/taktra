import { useTranslations } from 'use-intl'
import type { ProfileSummary } from '@/shared/model/profiles'
import { useProfiles } from '@/renderer/hooks/useProfiles'
import { AlertDialog } from '@/renderer/components/atoms/AlertDialog'
import { Modal } from '@/renderer/components/atoms/Modal'

interface UnavailableProfileDialogProps {
  readonly profile: ProfileSummary | null
  readonly onClose: () => void
}

export function UnavailableProfileDialog({
  profile,
  onClose
}: UnavailableProfileDialogProps): React.JSX.Element {
  const t = useTranslations('UnavailableProfileDialog')
  const { removeProfile } = useProfiles()
  const reason = profile?.unavailableReason ?? 'missing'

  return (
    <Modal isOpen={profile !== null} onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <AlertDialog
        title={t(`${reason}Title`)}
        actionLabel={t('remove')}
        cancelLabel={t('cancel')}
        onAction={() => profile && removeProfile(profile.path)}
      >
        <p>{t(`${reason}Text`)}</p>
        <p className="mt-2 font-mono text-xs break-all text-foreground">{profile?.path}</p>
      </AlertDialog>
    </Modal>
  )
}
