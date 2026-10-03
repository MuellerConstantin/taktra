import { z } from 'zod'
import { languages, themeSources } from '../settings'

export const settingsPatch = z
  .object({
    theme: z.enum(themeSources),
    language: z.enum(languages),
    miniTimer: z.boolean(),
    quickStartShortcutEnabled: z.boolean(),
    quickStartShortcut: z.string().min(1)
  })
  .partial()
  .strict()

export const accelerator = z.string().trim().min(3).includes('+')
