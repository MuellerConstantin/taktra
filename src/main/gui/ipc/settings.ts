import { z } from 'zod'
import { settingsPatch } from '@/shared/validation'
import { settings } from '@/main/core'
import { handle } from './handle'

export function registerSettingsHandlers(): void {
  handle('settings:get', z.tuple([]), () => settings.get())
  handle('settings:update', z.tuple([settingsPatch]), (_, patch) => settings.update(patch))
}
