import { describe, expect, it } from 'vitest'
import { matchesSearch } from '@/shared/model/names'

describe('search', () => {
  it('finds every word of the search in any order and case', () => {
    expect(matchesSearch('Review Alpha', 'alp rev')).toBe(true)
    expect(matchesSearch('Ärger Ölwechsel', 'ärger ÖL')).toBe(true)
    expect(matchesSearch('Review Alpha', 'review beta')).toBe(false)
  })

  it('matches everything with an empty search', () => {
    expect(matchesSearch('Review Alpha', '  ')).toBe(true)
  })
})
