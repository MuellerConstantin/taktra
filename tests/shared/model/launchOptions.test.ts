import { describe, expect, it } from 'vitest'
import { hasLaunchArgs, readLaunchArgs, toLaunchArgs } from '@/shared/model/launchOptions'

describe('launch arguments', () => {
  it('reads back the arguments it writes, as text', () => {
    expect(readLaunchArgs(['taktra.exe', ...toLaunchArgs({ startActivity: 12 })])).toEqual({
      startActivity: '12'
    })
    expect(readLaunchArgs(['taktra.exe', ...toLaunchArgs({ stopTimer: true })])).toEqual({
      stopTimer: true
    })
  })

  it('finds the options anywhere among other arguments', () => {
    expect(
      readLaunchArgs(['taktra.exe', '--allow-file-access', '--stop-timer', '--start-activity=3'])
    ).toEqual({ startActivity: '3', stopTimer: true })
  })

  it('tells a start with options from a plain one', () => {
    expect(hasLaunchArgs(readLaunchArgs(['taktra.exe']))).toBe(false)
    expect(hasLaunchArgs(readLaunchArgs(['taktra.exe', '--start-activity=abc']))).toBe(true)
  })
})
