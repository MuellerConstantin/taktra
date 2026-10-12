import { RiFilter3Line } from '@remixicon/react'
import { DialogTrigger } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import { Button } from '../atoms/Button'
import { Dialog } from '../atoms/Dialog'
import { Popover } from '../atoms/Popover'

interface FilterButtonProps {
  readonly count: number
  readonly onClear: () => void
  readonly children: React.ReactNode
}

export function FilterButton({ count, onClear, children }: FilterButtonProps): React.JSX.Element {
  const t = useTranslations('FilterButton')

  return (
    <DialogTrigger>
      <Button variant="secondary">
        <RiFilter3Line className="size-4" />
        {count > 0 ? t('active', { count }) : t('label')}
      </Button>
      <Popover placement="bottom start" className="w-80 max-w-[calc(100vw-2rem)]">
        <Dialog aria-label={t('label')} className="flex flex-col gap-3 p-4">
          {children}
          <Button
            variant="secondary"
            isDisabled={count === 0}
            onPress={onClear}
            className="self-end"
          >
            {t('clear')}
          </Button>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
