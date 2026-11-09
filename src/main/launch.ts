import { app } from 'electron'
import { z } from 'zod'
import {
  hasLaunchArgs,
  readLaunchArgs,
  type LaunchArgs,
  type LaunchOptions
} from '@/shared/model/launchOptions'
import { launchOptions } from '@/shared/validation'
import { timer } from './core'
import { openMainWindow } from './gui'

export function applyLaunchOptions({ startActivity, stopTimer }: LaunchOptions): void {
  try {
    if (stopTimer) timer.stop()
    if (startActivity !== undefined) timer.start(startActivity)
  } catch (error) {
    console.error('Launch options failed', error)
  }
}

function applyLaunchArgs(args: LaunchArgs): void {
  const result = launchOptions.safeParse(args)
  if (result.success) applyLaunchOptions(result.data)
  else console.error('Invalid launch options', z.prettifyError(result.error))
}

/**
 * Applies the options of this start, and those every later start hands over before it quits. A
 * later start without options brings the main window to the front instead.
 */
export function initLaunchOptions(): void {
  applyLaunchArgs(readLaunchArgs(process.argv))
  app.on('second-instance', (_, argv) => {
    const args = readLaunchArgs(argv)
    if (hasLaunchArgs(args)) applyLaunchArgs(args)
    else openMainWindow()
  })
}
