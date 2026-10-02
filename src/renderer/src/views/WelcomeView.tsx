import { useState } from 'react'
import { RiAddLine, RiFolderOpenLine, RiSparklingLine } from '@remixicon/react'
import { useTranslations } from 'use-intl'
import { Button } from '../components/atoms/Button'
import { CreateProfileDialog } from '../components/molecules/CreateProfileDialog'
import { OpenProfileErrorAlert } from '../components/molecules/OpenProfileErrorAlert'
import { useProfiles } from '../hooks/useProfiles'
import logo from '../../../../resources/icon.svg'

function WelcomeView(): React.JSX.Element {
  const t = useTranslations('WelcomeView')
  const { activeProfile, openProfile, createSampleProfile, removeProfile } = useProfiles()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [openError, setOpenError] = useState<unknown>(null)

  const handle = (action: () => Promise<void>) => async (): Promise<void> => {
    try {
      await action()
    } catch (error) {
      setOpenError(error)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <img src={logo} alt="" className="size-16 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {activeProfile?.isNewerVersion
              ? t('newerVersionText')
              : activeProfile
                ? t('missingText')
                : t('text')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onPress={() => setCreateOpen(true)}>
            <RiAddLine aria-hidden className="size-4" />
            {t('create')}
          </Button>
          <Button variant="secondary" onPress={handle(openProfile)}>
            <RiFolderOpenLine aria-hidden className="size-4" />
            {t('open')}
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">{t('sampleText')}</p>
          <Button variant="secondary" onPress={handle(createSampleProfile)}>
            <RiSparklingLine aria-hidden className="size-4" />
            {t('sample')}
          </Button>
        </div>
        {activeProfile && (
          <div className="flex flex-col items-center gap-2">
            <p className="font-mono text-xs break-all text-muted-foreground">
              {activeProfile.path}
            </p>
            <Button variant="secondary" onPress={() => removeProfile(activeProfile.path)}>
              {t('removeFromList')}
            </Button>
          </div>
        )}
      </div>
      <CreateProfileDialog isOpen={isCreateOpen} onOpenChange={setCreateOpen} />
      <OpenProfileErrorAlert error={openError} onClose={() => setOpenError(null)} />
    </div>
  )
}

export default WelcomeView
