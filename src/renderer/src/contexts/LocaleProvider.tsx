import { useEffect } from 'react'
import { I18nProvider } from 'react-aria-components'
import { IntlProvider } from 'use-intl'
import { useSettings } from '../hooks/useSettings'
import en from '../messages/en.json'
import de from '../messages/de.json'

const messages = { en, de }

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
