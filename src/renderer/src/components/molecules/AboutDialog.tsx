import {
  RiCheckLine,
  RiDownload2Line,
  RiFileCopyLine,
  RiFolderOpenLine,
  RiGithubLine,
  RiRefreshLine,
  RiRestartLine
} from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import { RELEASES_URL, REPOSITORY_URL, type AppInfo } from '../../../../shared/about'
import type { UpdateStatus } from '../../../../shared/updates'
import { useErrorMessage } from '../../hooks/useErrorMessage'
import { useUpdates } from '../../hooks/useUpdates'
import { api } from '../../lib/api'
import { Button } from '../atoms/Button'
import { Dialog, DialogHeading } from '../atoms/Dialog'
import { Modal } from '../atoms/Modal'
import logo from '../../../../../resources/icon.svg'

interface AboutDialogProps {
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
}

function infoText(info: AppInfo): string {
  return [
    `Taktra ${info.version}`,
    `Electron ${info.electron}, Chromium ${info.chrome}, Node.js ${info.node}`,
    info.os
  ].join('\n')
}

function updateMessage(
  status: UpdateStatus,
  t: ReturnType<typeof useTranslations<'AboutDialog'>>
): string | null {
  switch (status.state) {
    case 'unsupported':
      return t('updates.unsupported')
    case 'checking':
      return t('updates.checking')
    case 'upToDate':
      return t('updates.upToDate')
    case 'downloading':
      return t('updates.downloading', { version: status.version, percent: status.percent })
    case 'ready':
      return t('updates.ready', { version: status.version })
    case 'available':
      return t('updates.available', { version: status.version })
    case 'error':
      return t('updates.error')
    case 'idle':
      return null
  }
}

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps): React.JSX.Element {
  const t = useTranslations('AboutDialog')
  const errorMessage = useErrorMessage()
  const updates = useUpdates()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [isCopied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.app
      .info()
      .then(setInfo)
      .catch((caught) => setError(errorMessage(caught)))
  }, [errorMessage])

  const handleOpenChange = (open: boolean): void => {
    if (!open) {
      setCopied(false)
      setError(null)
    }
    onOpenChange(open)
  }

  const copyInfo = async (): Promise<void> => {
    if (!info) return
    await navigator.clipboard.writeText(infoText(info))
    setCopied(true)
  }

  const openDataFolder = async (): Promise<void> => {
    try {
      await api.app.openDataFolder()
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange} isDismissable>
      <Dialog>
        {({ close }) => (
          <div className="flex flex-col items-center gap-4 text-center">
            <img src={logo} alt="" className="size-16 rounded-2xl" />
            <div className="flex flex-col gap-1">
              <DialogHeading>Taktra</DialogHeading>
              <p className="text-sm text-muted-foreground tabular-nums">
                {info ? t('version', { version: info.version }) : ' '}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
              {info && (
                <p>{t('copyright', { year: new Date().getFullYear(), author: info.author })}</p>
              )}
              <p>{t('license')}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex w-full flex-col items-center gap-2 rounded-lg border border-border p-3">
              {updateMessage(updates.status, t) && (
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {updateMessage(updates.status, t)}
                </p>
              )}
              {updates.status.state === 'ready' ? (
                <Button onPress={() => updates.install().catch(console.error)}>
                  <RiRestartLine aria-hidden className="size-4" />
                  {t('updates.restart')}
                </Button>
              ) : updates.status.state === 'available' ? (
                <Button variant="secondary" onPress={() => window.open(RELEASES_URL, '_blank')}>
                  <RiDownload2Line aria-hidden className="size-4" />
                  {t('updates.download')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onPress={() => updates.check().catch(console.error)}
                  isDisabled={['unsupported', 'checking', 'downloading'].includes(
                    updates.status.state
                  )}
                >
                  <RiRefreshLine aria-hidden className="size-4" />
                  {t('updates.check')}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onPress={() => window.open(REPOSITORY_URL, '_blank')}>
                <RiGithubLine aria-hidden className="size-4" />
                {t('repository')}
              </Button>
              <Button variant="secondary" onPress={openDataFolder}>
                <RiFolderOpenLine aria-hidden className="size-4" />
                {t('dataFolder')}
              </Button>
              <Button variant="secondary" onPress={copyInfo} isDisabled={!info}>
                {isCopied ? (
                  <RiCheckLine aria-hidden className="size-4" />
                ) : (
                  <RiFileCopyLine aria-hidden className="size-4" />
                )}
                {isCopied ? t('copied') : t('copy')}
              </Button>
            </div>
            <Button autoFocus onPress={close} className="mt-2 self-stretch">
              {t('close')}
            </Button>
          </div>
        )}
      </Dialog>
    </Modal>
  )
}
