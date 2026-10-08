import { RiAddLine, RiDeleteBinLine, RiPencilLine } from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ListLayout, Virtualizer, useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Tag } from '../../../shared/tags'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Badge } from '../components/atoms/Badge'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { SearchField } from '../components/atoms/SearchField'
import { TagDialog } from '../components/molecules/TagDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useShortcut } from '../hooks/useShortcut'
import { useCreateRequest } from '../hooks/useCreateRequest'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { appShortcuts } from '../lib/shortcuts'
import { suggestColor } from '../lib/colors'

function TagsView(): React.JSX.Element {
  const t = useTranslations('TagsView')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const navigate = useNavigate()
  const [tags, setTags] = useState<readonly Tag[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ readonly tag?: Tag } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })

  const visibleTags = (tags ?? []).filter((tag) => contains(tag.name, query))

  useEffect(() => {
    let isCurrent = true
    api.tags
      .list()
      .then((result) => {
        if (!isCurrent) return
        setTags(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, reloadCount, errorMessage])

  const handleDelete = async (tag: Tag): Promise<void> => {
    setDeleteError(null)
    try {
      await api.tags.delete(tag.id)
    } catch (caught) {
      setDeleteError(errorMessage(caught))
    }
    setReloadCount((count) => count + 1)
  }

  useShortcut(appShortcuts.create, () => setDialog({}))
  useCreateRequest(() => setDialog({}))
  useShortcut(appShortcuts.search, () => searchRef.current?.focus())

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
        help={t('help')}
        actions={
          <Button onPress={() => setDialog({})} shortcut={appShortcuts.create}>
            <RiAddLine className="size-4" />
            {t('create')}
          </Button>
        }
      >
        <div className="flex items-center gap-2 pb-4">
          <SearchField
            inputRef={searchRef}
            aria-label={t('search')}
            placeholder={t('search')}
            value={query}
            onChange={setQuery}
            className="w-64"
          />
        </div>
      </ViewHeader>
      {deleteError && <p className="px-8 pt-4 text-sm text-destructive">{deleteError}</p>}
      {error && <p className="p-8 text-sm text-destructive">{error}</p>}
      {!error && tags && (
        <Virtualizer layout={ListLayout} layoutOptions={{ rowSize: 48 }}>
          <GridList
            aria-label={t('title')}
            items={visibleTags}
            onAction={(key) => navigate(`/tags/${key}`)}
            className="min-h-0 flex-1"
            renderEmptyState={() =>
              visibleTags.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  {query ? t('noMatches') : t('empty')}
                </p>
              )
            }
          >
            {(tag) => (
              <GridListItem textValue={tag.name}>
                <div className="flex min-w-0 flex-1">
                  <Badge color={tag.color}>{tag.name}</Badge>
                </div>
                <Button
                  variant="icon"
                  aria-label={t('edit', { name: tag.name })}
                  onPress={() => setDialog({ tag })}
                >
                  <RiPencilLine className="size-4" />
                </Button>
                <Button
                  variant="icon"
                  aria-label={t('delete', { name: tag.name })}
                  onPress={() => setTagToDelete(tag)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              </GridListItem>
            )}
          </GridList>
        </Virtualizer>
      )}
      {dialog && (
        <TagDialog
          tag={dialog.tag}
          defaultColor={suggestColor(tags ?? [])}
          onClose={() => setDialog(null)}
          onSaved={() => setReloadCount((count) => count + 1)}
        />
      )}
      <Modal
        isOpen={tagToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setTagToDelete(null)}
        isDismissable
      >
        {tagToDelete && (
          <AlertDialog
            variant="destructive"
            title={t('deleteConfirmTitle', { name: tagToDelete.name })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() => handleDelete(tagToDelete)}
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default TagsView
