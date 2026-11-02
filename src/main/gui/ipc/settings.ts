import { z } from 'zod'
import { settingsPatch } from '../../../shared/validation'
import { getSettings, updateSettings } from '../../core/app/settings'
import { handle } from './handle'

export function initSettings(): void {
  handle('settings:get', z.tuple([]), () => getSettings())
  handle('settings:update', z.tuple([settingsPatch]), (_, patch) => updateSettings(patch))
}
