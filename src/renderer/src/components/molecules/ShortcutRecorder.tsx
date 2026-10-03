import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import { api } from '../../lib/api'
import { acceleratorFromEvent } from '../../lib/shortcuts'
import { Button } from '../atoms/Button'
import { KeyCombo } from '../atoms/KeyCombo'

interface ShortcutRecorderProps {
  readonly value: string
  readonly onChange: (accelerator: string) => void
  readonly isDisabled?: boolean
  readonly 'aria-label': string
}

export function ShortcutRecorder({
  value,
  onChange,
  isDisabled,
  'aria-label': ariaLabel
}: ShortcutRecorderProps): React.JSX.Element {
  const t = useTranslations('ShortcutRecorder')
  const [isRecording, setRecording] = useState(false)

  useEffect(() => {
    if (!isRecording) return
    api.shortcuts.setRecording(true).catch(console.error)
    return () => {
      api.shortcuts.setRecording(false).catch(console.error)
    }
  }, [isRecording])

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (!isRecording) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      setRecording(false)
      return
    }
    const accelerator = acceleratorFromEvent(event)
    if (!accelerator) return
    setRecording(false)
    onChange(accelerator)
  }

  return (
    <Button
      variant="secondary"
      aria-label={ariaLabel}
      isDisabled={isDisabled}
      onPress={() => setRecording(true)}
      onKeyDown={handleKeyDown}
      onBlur={() => setRecording(false)}
      className="min-w-44"
    >
      {isRecording ? (
        <span className="text-muted-foreground">{t('recording')}</span>
      ) : (
        <KeyCombo accelerator={value} size="md" />
      )}
    </Button>
  )
}
