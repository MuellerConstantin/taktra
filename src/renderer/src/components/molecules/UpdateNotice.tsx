import { RiDownload2Line, RiRestartLine } from '@remixicon/react'
import { useTranslations } from 'use-intl'
import { RELEASES_URL } from '../../../../shared/about'
import { useUpdates } from '../../hooks/useUpdates'
import { Button } from '../atoms/Button'

/** Shown in the sidebar once an update is waiting for the user. */
export function UpdateNotice(): React.JSX.Element | null {
  const t = useTranslations('UpdateNotice')
  const { status, install } = useUpdates()

  if (status.state !== 'ready' && status.state !== 'available') return null

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <p className="text-sm">
        {status.state === 'ready'
          ? t('ready', { version: status.version })
          : t('available', { version: status.version })}
      </p>
      {status.state === 'ready' ? (
        <Button onPress={() => install().catch(console.error)}>
          <RiRestartLine aria-hidden className="size-4" />
          {t('restart')}
        </Button>
      ) : (
        <Button variant="secondary" onPress={() => window.open(RELEASES_URL, '_blank')}>
          <RiDownload2Line aria-hidden className="size-4" />
          {t('download')}
        </Button>
      )}
    </div>
  )
}
