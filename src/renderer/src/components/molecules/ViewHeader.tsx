import { RiQuestionLine } from '@remixicon/react'
import { DialogTrigger } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { Button } from '../atoms/Button'
import { Dialog } from '../atoms/Dialog'
import { Popover } from '../atoms/Popover'

interface ViewHeaderProps {
  readonly title: React.ReactNode
  readonly subtitle?: React.ReactNode
  readonly help?: string
  readonly actions?: React.ReactNode
  readonly children?: React.ReactNode
}

export function ViewHeader({
  title,
  subtitle,
  help,
  actions,
  children
}: ViewHeaderProps): React.JSX.Element {
  const t = useTranslations('ViewHeader')

  return (
    <header className="border-b border-border px-8 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-5">
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="min-w-0 text-xl font-semibold">{title}</h1>
            {help && (
              <DialogTrigger>
                <Button variant="icon" aria-label={t('help')}>
                  <RiQuestionLine className="size-4" />
                </Button>
                <Popover placement="bottom start" className="max-w-80">
                  <Dialog aria-label={t('help')} className="p-4 text-sm">
                    {help}
                  </Dialog>
                </Popover>
              </DialogTrigger>
            )}
          </div>
        </div>
        {actions && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{actions}</div>
        )}
      </div>
      {children}
    </header>
  )
}
