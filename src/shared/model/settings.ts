export const themeSources = ['system', 'light', 'dark'] as const

export type ThemeSource = (typeof themeSources)[number]

export const DEFAULT_QUICK_START_SHORTCUT = 'CommandOrControl+Alt+T'

export const DEFAULT_API_PORT = 47011

export const languages = ['en', 'de'] as const

export type Language = (typeof languages)[number]

export type Settings = {
  readonly theme: ThemeSource
  readonly language: Language
  readonly miniTimer: boolean
  readonly quickStartShortcutEnabled: boolean
  readonly quickStartShortcut: string
  readonly autoUpdate: boolean
  readonly apiEnabled: boolean
  readonly apiPort: number
}
