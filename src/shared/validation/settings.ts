import { z } from 'zod'
import { languages, themeSources } from '../model/settings'

export const apiPort = z.number().int().min(1024).max(65535)

export const settingsPatch = z
  .object({
    theme: z.enum(themeSources),
    language: z.enum(languages),
    miniTimer: z.boolean(),
    quickStartShortcutEnabled: z.boolean(),
    quickStartShortcut: z.string().min(1),
    autoUpdate: z.boolean(),
    apiEnabled: z.boolean(),
    apiPort: apiPort
  })
  .partial()
  .strict()

export const accelerator = z.string().trim().min(3).includes('+')
