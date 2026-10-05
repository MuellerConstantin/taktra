import { RiFolderTransferLine, RiMoreLine, RiPencilLine } from '@remixicon/react'
import { useState } from 'react'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../../shared/activities'
import { Button } from '../atoms/Button'
import { Menu, MenuItem, MenuTrigger } from '../atoms/Menu'
import { ActivityDialog } from './ActivityDialog'
import { MoveActivityDialog } from './MoveActivityDialog'

interface ActivityMenuProps {
  readonly activity: ActivityRef
  readonly onChanged: () => void
}

export function ActivityMenu({ activity, onChanged }: ActivityMenuProps): React.JSX.Element {
  const t = useTranslations('ActivityMenu')
  const [dialog, setDialog] = useState<'edit' | 'move' | null>(null)

  return (
    <>
      <MenuTrigger placement="bottom end">
        <Button variant="icon" aria-label={t('label', { name: activity.name })}>
          <RiMoreLine className="size-4" />
        </Button>
        <Menu onAction={(key) => setDialog(key === 'move' ? 'move' : 'edit')}>
          <MenuItem id="edit">
            <RiPencilLine aria-hidden className="size-4" />
            {t('edit')}
          </MenuItem>
          <MenuItem id="move">
            <RiFolderTransferLine aria-hidden className="size-4" />
            {t('move')}
          </MenuItem>
        </Menu>
      </MenuTrigger>
      {dialog === 'edit' && (
        <ActivityDialog activity={activity} onClose={() => setDialog(null)} onSaved={onChanged} />
      )}
      {dialog === 'move' && (
        <MoveActivityDialog
          activity={activity}
          onClose={() => setDialog(null)}
          onMoved={onChanged}
        />
      )}
    </>
  )
}
