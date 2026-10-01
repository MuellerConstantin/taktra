export const themeSources = ['system', 'light', 'dark'] as const

export type ThemeSource = (typeof themeSources)[number]

export const languages = ['en', 'de'] as const

export type Language = (typeof languages)[number]

export interface Settings {
  readonly theme: ThemeSource
  readonly language: Language
}
