import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslations } from 'use-intl'
import type { ProfileSummary } from '../../../../shared/profiles'
import { useProfiles } from '../../hooks/useProfiles'
import { AlertDialog } from '../atoms/AlertDialog'
import { Button } from '../atoms/Button'
import { Modal } from '../atoms/Modal'

interface DeleteProfileSectionProps {
  readonly profile: ProfileSummary
  readonly profileName: string
}

export function DeleteProfileSection({
  profile,
  profileName
}: DeleteProfileSectionProps): React.JSX.Element {
  const t = useTranslations('DeleteProfileSection')
  const { deleteProfile } = useProfiles()
  const navigate = useNavigate()
  const [isConfirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (): Promise<void> => {
    setError(null)
    try {
      await deleteProfile(profile.path)
      navigate('/tracking')
    } catch {
      setError(t('deleteFailed'))
    }
  }

  return (
    <section className="flex max-w-xl flex-col gap-3 rounded-lg border border-destructive/40 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Button variant="destructive" onPress={() => setConfirmOpen(true)} className="self-start">
        {t('action')}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Modal isOpen={isConfirmOpen} onOpenChange={setConfirmOpen} isDismissable>
        <AlertDialog
          variant="destructive"
          title={t('confirmTitle', { name: profileName })}
          actionLabel={t('confirmAction')}
          cancelLabel={t('cancel')}
          onAction={handleDelete}
        >
          {t('confirmText')}
        </AlertDialog>
      </Modal>
    </section>
  )
}
