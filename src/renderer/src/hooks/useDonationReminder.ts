import { RiHeartLine } from '@remixicon/react'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'use-intl'
import { DONATION_URL } from '../../../shared/about'
import { api, events } from '../lib/api'
import { appShortcuts } from '../lib/shortcuts'
import { toastQueue } from '../lib/toasts'
import { useShortcut } from './useShortcut'

/** Asks for a donation in a toast now and then, see the main process for when. */
export function useDonationReminder(): void {
  const t = useTranslations('DonationReminder')
  const toastKey = useRef<string | null>(null)

  const show = useCallback(() => {
    if (toastKey.current) return
    toastKey.current = toastQueue.add(
      {
        text: t('text'),
        actions: [
          {
            label: t('dismiss'),
            onAction: () => void api.donation.dismiss().catch(console.error)
          },
          {
            label: t('donate'),
            icon: RiHeartLine,
            variant: 'primary',
            onAction: () => window.open(DONATION_URL, '_blank')
          }
        ]
      },
      {
        onClose: () => {
          toastKey.current = null
          api.donation.snooze().catch(console.error)
        }
      }
    )
  }, [t])

  useEffect(() => {
    const load = (): void =>
      void api.donation
        .hint()
        .then((isDue) => isDue && show())
        .catch(console.error)
    load()
    return events.onDonationChanged(load)
  }, [show])

  useShortcut(appShortcuts.donation, show)
}
