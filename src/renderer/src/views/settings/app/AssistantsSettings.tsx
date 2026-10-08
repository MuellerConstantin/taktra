import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'
import type { McpClientConfig } from '../../../../../shared/mcp'
import { Button } from '../../../components/atoms/Button'
import { Switch } from '../../../components/atoms/Switch'
import { useErrorMessage } from '../../../hooks/useErrorMessage'
import { useSettings } from '../../../hooks/useSettings'
import { api } from '../../../lib/api'

const SERVER_NAME = 'taktra'

function claudeDesktopConfig(config: McpClientConfig): string {
  return JSON.stringify({ mcpServers: { [SERVER_NAME]: config } }, null, 2)
}

function claudeCodeCommand({ command, args, env }: McpClientConfig): string {
  const envOptions = Object.entries(env).map(([key, value]) => `--env ${key}=${value}`)
  const quoted = [command, ...args].map((part) => `"${part}"`)
  return ['claude mcp add', SERVER_NAME, '--scope user', ...envOptions, '--', ...quoted].join(' ')
}

interface SetupBlockProps {
  readonly title: string
  readonly description: string
  readonly code: string
}

function SetupBlock({ title, description, code }: SetupBlockProps): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const [isCopied, setCopied] = useState(false)

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-0.5">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
        <Button variant="secondary" onPress={copy}>
          {isCopied ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
          {isCopied ? t('copied') : t('copy')}
        </Button>
      </div>
      <pre className="rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  )
}

function AssistantsSettings(): React.JSX.Element {
  const t = useTranslations('AssistantsSettings')
  const errorMessage = useErrorMessage()
  const { settings, updateSettings } = useSettings()
  const [config, setConfig] = useState<McpClientConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true
    api.mcp
      .config()
      .then((loaded) => isCurrent && setConfig(loaded))
      .catch((caught) => isCurrent && setError(errorMessage(caught)))
    return () => {
      isCurrent = false
    }
  }, [errorMessage])

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
          {config && (
            <>
              <SetupBlock
                title={t('setup.claudeDesktop')}
                description={t('setup.claudeDesktopDescription')}
                code={claudeDesktopConfig(config)}
              />
              <SetupBlock
                title={t('setup.claudeCode')}
                description={t('setup.claudeCodeDescription')}
                code={claudeCodeCommand(config)}
              />
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default AssistantsSettings
