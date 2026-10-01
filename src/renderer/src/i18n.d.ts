import type en from './messages/en.json'
import type { Language } from '../../shared/settings'

declare module 'use-intl' {
  interface AppConfig {
    Locale: Language
    Messages: typeof en
  }
}
