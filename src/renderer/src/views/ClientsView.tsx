import {
  RiAddLine,
  RiArchiveLine,
  RiDeleteBinLine,
  RiInboxUnarchiveLine,
  RiPencilLine
} from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import { ListLayout, Virtualizer, useFilter } from 'react-aria-components'
import { useTranslations } from 'use-intl'
import type { Client } from '../../../shared/clients'
import { AlertDialog } from '../components/atoms/AlertDialog'
import { Button } from '../components/atoms/Button'
import { GridList, GridListItem } from '../components/atoms/GridList'
import { Modal } from '../components/atoms/Modal'
import { SearchField } from '../components/atoms/SearchField'
import { ToggleButton } from '../components/atoms/ToggleButton'
import { ClientDialog } from '../components/molecules/ClientDialog'
import { ViewHeader } from '../components/molecules/ViewHeader'
import { useErrorMessage } from '../hooks/useErrorMessage'
import { useShortcut } from '../hooks/useShortcut'
import { useProfiles } from '../hooks/useProfiles'
import { api } from '../lib/api'
import { appShortcuts } from '../lib/shortcuts'

function ClientsView(): React.JSX.Element {
  const t = useTranslations('ClientsView')
  const errorMessage = useErrorMessage()
  const { activeProfile } = useProfiles()
  const [showArchived, setShowArchived] = useState(false)
  const [clients, setClients] = useState<readonly Client[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ readonly client?: Client } | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })

  const visibleClients = (clients ?? []).filter((client) => contains(client.name, query))

  useEffect(() => {
    let isCurrent = true
    api.clients
      .list({ includeArchived: showArchived })
      .then((result) => {
        if (!isCurrent) return
        setClients(result)
        setError(null)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [activeProfile?.path, showArchived, reloadCount, errorMessage])

  const runAction = async (action: () => Promise<unknown>): Promise<void> => {
    setActionError(null)
    try {
      await action()
    } catch (caught) {
      setActionError(errorMessage(caught))
    }
    setReloadCount((count) => count + 1)
  }

  useShortcut(appShortcuts.create, () => setDialog({}))
  useShortcut(appShortcuts.search, () => searchRef.current?.focus())

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title={t('title')}
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
          <ToggleButton isSelected={showArchived} onChange={setShowArchived}>
            <RiArchiveLine className="size-4" />
            {t('showArchived')}
          </ToggleButton>
        </div>
      </ViewHeader>
      {actionError && <p className="px-8 pt-4 text-sm text-destructive">{actionError}</p>}
      {error && <p className="p-8 text-sm text-destructive">{error}</p>}
      {!error && clients && (
        <Virtualizer layout={ListLayout} layoutOptions={{ rowSize: 48 }}>
          <GridList
            aria-label={t('title')}
            items={visibleClients}
            className="min-h-0 flex-1"
            renderEmptyState={() =>
              visibleClients.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  {query ? t('noMatches') : t('empty')}
                </p>
              )
            }
          >
            {(client) => (
              <GridListItem textValue={client.name}>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{client.name}</span>
                  {client.archivedAt && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {t('archived')}
                    </span>
                  )}
                </span>
                <Button
                  variant="icon"
                  aria-label={t('edit', { name: client.name })}
                  onPress={() => setDialog({ client })}
                >
                  <RiPencilLine className="size-4" />
                </Button>
                <Button
                  variant="icon"
                  aria-label={
                    client.archivedAt
                      ? t('unarchive', { name: client.name })
                      : t('archive', { name: client.name })
                  }
                  onPress={() =>
                    runAction(() => api.clients.setArchived(client.id, !client.archivedAt))
                  }
                >
                  {client.archivedAt ? (
                    <RiInboxUnarchiveLine className="size-4" />
                  ) : (
                    <RiArchiveLine className="size-4" />
                  )}
                </Button>
                <Button
                  variant="icon"
                  aria-label={t('delete', { name: client.name })}
                  onPress={() => setClientToDelete(client)}
                >
                  <RiDeleteBinLine className="size-4" />
                </Button>
              </GridListItem>
            )}
          </GridList>
        </Virtualizer>
      )}
      {dialog && (
        <ClientDialog
          client={dialog.client}
          onClose={() => setDialog(null)}
          onSaved={() => setReloadCount((count) => count + 1)}
        />
      )}
      <Modal
        isOpen={clientToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}
        isDismissable
      >
        {clientToDelete && (
          <AlertDialog
            variant="destructive"
            title={t('deleteConfirmTitle', { name: clientToDelete.name })}
            actionLabel={t('deleteConfirmAction')}
            cancelLabel={t('cancel')}
            onAction={() => runAction(() => api.clients.delete(clientToDelete.id))}
          >
            {t('deleteConfirmText')}
          </AlertDialog>
        )}
      </Modal>
    </div>
  )
}

export default ClientsView
