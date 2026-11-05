import { useEffect } from 'react'
import { I18nProvider } from 'react-aria-components'
import { IntlProvider } from 'use-intl'
import { useSettings } from '@/renderer/hooks/useSettings'
import en from '@/renderer/messages/en.json'
import de from '@/renderer/messages/de.json'
import type { Language } from '@/shared/model/settings'

const messages: Readonly<Record<Language, typeof en>> = { en, de }

interface LocaleProviderProps {
  readonly children: React.ReactNode
}

function LocaleProvider({ children }: LocaleProviderProps): React.JSX.Element {
  const { language } = useSettings().settings

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <IntlProvider locale={language} messages={messages[language]}>
      <I18nProvider locale={language}>{children}</I18nProvider>
    </IntlProvider>
  )
}

export default LocaleProvider
