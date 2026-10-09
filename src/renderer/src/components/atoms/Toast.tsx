import { RiCloseLine } from '@remixicon/react'
import {
  Text,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as RACToastContent,
  UNSTABLE_ToastRegion as RACToastRegion
} from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { toastQueue } from '../../lib/toasts'
import { Button } from './Button'
import './Toast.css'

/** Shows the toasts of the queue in `lib/toasts.ts`; rendered once per window. */
export function ToastRegion(): React.JSX.Element {
  const t = useTranslations('Toast')

  return (
    <RACToastRegion
      queue={toastQueue}
      className="fixed right-4 bottom-4 z-50 flex flex-col-reverse gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {({ toast }) => (
        <RACToast
          toast={toast}
          style={{ viewTransitionName: toast.key }}
          className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none [view-transition-class:toast] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start gap-2">
            <RACToastContent className="min-w-0 flex-1">
              <Text slot="title" className="text-sm">
                {toast.content.text}
              </Text>
            </RACToastContent>
            <Button variant="icon" slot="close" aria-label={t('close')}>
              <RiCloseLine aria-hidden className="size-4" />
            </Button>
          </div>
          {toast.content.actions && (
            <div className="flex flex-wrap justify-end gap-2">
              {toast.content.actions.map(({ label, icon: Icon, variant, onAction }) => (
                <Button
                  key={label}
                  variant={variant ?? 'secondary'}
                  onPress={() => {
                    onAction()
                    toastQueue.close(toast.key)
                  }}
                >
                  {Icon && <Icon aria-hidden className="size-4" />}
                  {label}
                </Button>
              ))}
            </div>
          )}
        </RACToast>
      )}
    </RACToastRegion>
  )
}
