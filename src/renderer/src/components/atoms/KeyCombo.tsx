import { tv } from 'tailwind-variants'
import { useTranslations } from 'use-intl'
import { formatAccelerator } from '../../lib/shortcuts'

const keyStyles = tv({
  base: 'rounded border border-border font-sans',
  variants: {
    size: {
      sm: 'bg-muted px-1 text-[10px] leading-4 text-muted-foreground',
      md: 'bg-background px-1.5 py-0.5 text-xs'
    }
  }
})

interface KeyComboProps {
  readonly accelerator: string
  readonly size?: 'sm' | 'md'
}

export function KeyCombo({ accelerator, size = 'sm' }: KeyComboProps): React.JSX.Element {
  const t = useTranslations('Keys')
  const keys = formatAccelerator(accelerator, { ctrl: t('ctrl'), space: t('space') })

  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key) => (
        <kbd key={key} className={keyStyles({ size })}>
          {key}
        </kbd>
      ))}
    </span>
  )
}
