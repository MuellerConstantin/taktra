export const themeSources = ['system', 'light', 'dark'] as const

export type ThemeSource = (typeof themeSources)[number]

export interface Settings {
  readonly theme: ThemeSource
}
