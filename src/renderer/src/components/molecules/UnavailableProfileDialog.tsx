import { useTranslations } from 'use-intl'
import type { ProfileSummary } from '../../../../shared/profiles'
import { useProfiles } from '../../hooks/useProfiles'
import { AlertDialog } from '../atoms/AlertDialog'
import { Modal } from '../atoms/Modal'

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

  return (
    <Modal isOpen={profile !== null} onOpenChange={(isOpen) => !isOpen && onClose()} isDismissable>
      <AlertDialog
        title={profile?.isNewerVersion ? t('newerVersionTitle') : t('title')}
        actionLabel={t('remove')}
        cancelLabel={t('cancel')}
        onAction={() => profile && removeProfile(profile.path)}
      >
        <p>{profile?.isNewerVersion ? t('newerVersionText') : t('text')}</p>
        <p className="mt-2 font-mono text-xs break-all text-foreground">{profile?.path}</p>
      </AlertDialog>
    </Modal>
  )
}
