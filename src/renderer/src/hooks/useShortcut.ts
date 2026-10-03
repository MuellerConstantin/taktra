import { useEffect, useRef } from 'react'
import { matchesAccelerator } from '../lib/shortcuts'

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function useShortcut(accelerator: string, handler: () => void, isEnabled = true): void {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!isEnabled) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || !matchesAccelerator(event, accelerator)) return
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey
      if (!hasModifier && isEditable(event.target)) return
      if (document.querySelector('[role=dialog], [role=alertdialog]')) return
      event.preventDefault()
      handlerRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [accelerator, isEnabled])
}
