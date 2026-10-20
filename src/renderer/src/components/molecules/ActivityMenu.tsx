import {
  RiArchiveLine,
  RiFolderTransferLine,
  RiInboxUnarchiveLine,
  RiMergeCellsHorizontal,
  RiMore2Line,
  RiPencilLine
} from '@remixicon/react'
import { useState } from 'react'
import { useTranslations } from 'use-intl'
import type { ActivityRef } from '../../../../shared/activities'
import { Button } from '../atoms/Button'
import { Menu, MenuItem, MenuTrigger } from '../atoms/Menu'
import { ActivityDialog } from './ActivityDialog'
import { MergeActivityDialog } from './MergeActivityDialog'
import { MoveActivityDialog } from './MoveActivityDialog'

interface ActivityMenuProps {
  readonly activity: ActivityRef
  readonly onChanged: () => void
  readonly onMerged?: (targetId: number) => void
  /** Adds archiving to the menu, where the archive state of the activity is known. */
  readonly archive?: { readonly isArchived: boolean; readonly onToggle: () => void }
}

export function ActivityMenu({
  activity,
  onChanged,
  onMerged,
  archive
}: ActivityMenuProps): React.JSX.Element {
  const t = useTranslations('ActivityMenu')
  const [dialog, setDialog] = useState<'edit' | 'move' | 'merge' | null>(null)

  return (
    <>
      <MenuTrigger placement="bottom end">
        <Button variant="icon" aria-label={t('label', { name: activity.name })}>
          <RiMore2Line className="size-4" />
        </Button>
        <Menu
          onAction={(key) => {
            if (key === 'archive') archive?.onToggle()
            else setDialog(key === 'move' || key === 'merge' ? key : 'edit')
          }}
        >
          <MenuItem id="edit">
            <RiPencilLine aria-hidden className="size-4" />
            {t('edit')}
          </MenuItem>
          <MenuItem id="move">
            <RiFolderTransferLine aria-hidden className="size-4" />
            {t('move')}
          </MenuItem>
          <MenuItem id="merge">
            <RiMergeCellsHorizontal aria-hidden className="size-4" />
            {t('merge')}
          </MenuItem>
          {archive && (
            <MenuItem id="archive">
              {archive.isArchived ? (
                <RiInboxUnarchiveLine aria-hidden className="size-4" />
              ) : (
                <RiArchiveLine aria-hidden className="size-4" />
              )}
              {archive.isArchived ? t('unarchive') : t('archive')}
            </MenuItem>
          )}
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
      {dialog === 'merge' && (
        <MergeActivityDialog
          activity={activity}
          onClose={() => setDialog(null)}
          onMerged={(targetId) => (onMerged ? onMerged(targetId) : onChanged())}
        />
      )}
    </>
  )
}
