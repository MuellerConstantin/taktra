import { RiCheckLine, RiExternalLinkLine, RiFileCopyLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import type { McpClientConfig, McpClientStatus } from '../../../../../shared/mcp'
import { Button } from '../../../components/atoms/Button'
import {
  Disclosure,
  DisclosureGroup,
  DisclosureHeader,
  DisclosurePanel
} from '../../../components/atoms/Disclosure'
import { Switch } from '../../../components/atoms/Switch'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useSettings } from '../../../hooks/useSettings'
import { api } from '../../../lib/api'

const cardClassName = 'overflow-hidden rounded-xl border border-border bg-card'

function CopyButton({ text }: { readonly text: string }): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const [isCopied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
  }

  return (
    <Button variant="icon" aria-label={isCopied ? t('copied') : t('copy')} onPress={copy}>
      {isCopied ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
    </Button>
  )
}

function Code({ children }: { readonly children: string }): React.JSX.Element {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted py-2 pr-2 pl-3">
      <pre className="min-w-0 flex-1 font-mono text-xs break-all whitespace-pre-wrap">
        {children}
      </pre>
      <CopyButton text={children} />
    </div>
  )
}

function ManualSetup({ config }: { readonly config: McpClientConfig }): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.manual')
  const values = [
    { label: t('command'), value: config.command },
    { label: t('arguments'), value: config.args.join(' ') },
    {
      label: t('environment'),
      value: Object.entries(config.env)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ')
    }
  ]

  return (
    <Disclosure id="manual" className={cardClassName}>
      <DisclosureHeader className="px-4 py-3">
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">{t('title')}</span>
          <span className="text-muted-foreground">{t('subtitle')}</span>
        </span>
      </DisclosureHeader>
      <DisclosurePanel>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          <dl className="flex flex-col gap-2">
            {values.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd>
                  <Code>{value}</Code>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

interface ClientRowProps {
  readonly client: McpClientStatus
  readonly onConnect: () => void
  readonly onDisconnect: () => void
}

function ClientAction({ client, onConnect, onDisconnect }: ClientRowProps): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.clients')

  switch (client.state) {
    case 'notInstalled':
      return (
        <Button variant="secondary" onPress={() => window.open(client.downloadUrl, '_blank')}>
          <RiExternalLinkLine className="size-4" />
          {t('download')}
        </Button>
      )
    case 'disconnected':
      return <Button onPress={onConnect}>{t('connect')}</Button>
    case 'outdated':
      return <Button onPress={onConnect}>{t('reconnect')}</Button>
    case 'connected':
      return (
        <Button variant="secondary" onPress={onDisconnect}>
          {t('disconnect')}
        </Button>
      )
    case 'invalid':
      return <></>
  }
}

function ClientRow(props: ClientRowProps): React.JSX.Element {
  const t = useTranslations('AssistantsSettings.clients')
  const { client } = props

  return (
    <Disclosure id={client.id} className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 pr-4">
        <div className="min-w-0 flex-1">
          <DisclosureHeader className="px-4 py-3">
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{client.name}</span>
              <span
                className={client.state === 'connected' ? 'text-primary' : 'text-muted-foreground'}
              >
                {t(`states.${client.state}`)}
              </span>
            </span>
          </DisclosureHeader>
        </div>
        <ClientAction {...props} />
      </div>
      <DisclosurePanel>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <p className="text-sm break-all text-muted-foreground">
            {t('manual', { path: client.configPath })}
          </p>
          <Code>{client.manualEntry}</Code>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

function AssistantsSettings(): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const errorMessage = useErrorMessage()
  const { settings, updateSettings } = useSettings()
  const [config, setConfig] = useState<McpClientConfig | null>(null)
  const [clients, setClients] = useState<readonly McpClientStatus[]>([])
  const [restartName, setRestartName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    Promise.all([api.mcp.config(), api.mcp.clients()])
      .then(([loadedConfig, loadedClients]) => {
        if (!isCurrent) return
        setConfig(loadedConfig)
        setClients(loadedClients)
      })
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [errorMessage])

  const change = async (
    client: McpClientStatus,
    action: (id: string) => Promise<McpClientStatus[]>
  ): Promise<void> => {
    setError(null)
    setRestartName(null)
    try {
      setClients(await action(client.id))
      setRestartName(client.name)
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">{t('label')}</span>
            <span className="text-sm text-muted-foreground">{t('description')}</span>
          </div>
          <Switch
            aria-label={t('label')}
            isSelected={settings.mcpAccess}
            onChange={(mcpAccess) => updateSettings({ mcpAccess })}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('privacy')}</p>
      </section>
      {settings.mcpAccess && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{t('setup.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('setup.description')}</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {restartName && (
            <p className="text-sm text-primary">{t('setup.restart', { name: restartName })}</p>
          )}
          {clients.length > 0 && (
            <DisclosureGroup allowsMultipleExpanded className={cardClassName}>
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onConnect={() => change(client, api.mcp.connect)}
                  onDisconnect={() => change(client, api.mcp.disconnect)}
                />
              ))}
            </DisclosureGroup>
          )}
          {config && (
            <>
              <p className="pt-2 text-sm text-muted-foreground">{t('setup.other')}</p>
              <ManualSetup config={config} />
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default AssistantsSettings
