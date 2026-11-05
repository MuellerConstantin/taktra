import type { RemixiconComponentType } from '@remixicon/react'
import { UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components'
import { flushSync } from 'react-dom'

export interface ToastAction {
  readonly label: string
  readonly icon?: RemixiconComponentType
  readonly variant?: 'primary' | 'secondary'
  readonly onAction: () => void
}

export interface ToastContent {
  readonly text: string
  readonly actions?: readonly ToastAction[]
}

export const toastQueue = new ToastQueue<ToastContent>({
  wrapUpdate(fn) {
    if ('startViewTransition' in document) document.startViewTransition(() => flushSync(fn))
    else fn()
  }
})
