import { describe, expect, it } from 'vitest'
import { launchOptions } from '@/shared/validation'

describe('launch options', () => {
  it('turns the activity id into a number', () => {
    expect(launchOptions.parse({ startActivity: '12', stopTimer: true })).toEqual({
      startActivity: 12,
      stopTimer: true
    })
  })

  it('refuses an activity id that is not a positive whole number', () => {
    for (const startActivity of ['abc', '-1', '0', '1.5', ''])
      expect(launchOptions.safeParse({ startActivity }).success).toBe(false)
  })
})
