export const themeSources = ['system', 'light', 'dark'] as const

export type ThemeSource = (typeof themeSources)[number]

export const DEFAULT_QUICK_START_SHORTCUT = 'CommandOrControl+Alt+T'

export type ShortcutStatus = 'active' | 'disabled' | 'unavailable'

export const languages = ['en', 'de'] as const

export type Language = (typeof languages)[number]

export interface Settings {
  readonly theme: ThemeSource
  readonly language: Language
  readonly miniTimer: boolean
  readonly quickStartShortcutEnabled: boolean
  readonly quickStartShortcut: string
  readonly autoUpdate: boolean
}
