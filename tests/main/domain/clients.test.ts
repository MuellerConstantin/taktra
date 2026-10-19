import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { activateDatabase, closeActiveDatabase } from '../../../src/main/db/database'
import {
  createActivity,
  findActivity,
  getActivityDetails,
  moveActivity,
  setActivityClient
} from '../../../src/main/domain/activities'
import { createClient } from '../../../src/main/domain/clients'
import { createProject, updateProject } from '../../../src/main/domain/projects'
import { aggregate } from '../../../src/main/domain/reports'
import { createTimeEntry } from '../../../src/main/domain/timeEntries'
import { createTestProfile } from '../../profiles'

const NO_CLIENT = '(none)'

type Ids = Record<
  'contoso' | 'fabrikam' | 'alpha' | 'beta' | 'gamma' | 'build' | 'run' | 'ops',
  number
>

let ids: Ids

/**
 * Alpha has no client: Build has its own (Fabrikam, 30 min), Run none (10 min).
 * Beta has Contoso for its activity Ops (20 min). Gamma has no client and no activities.
 */
function seed(): Ids {
  const contoso = createClient({ name: 'Contoso' }).id
  const fabrikam = createClient({ name: 'Fabrikam' }).id
  const alpha = createProject({ name: 'Alpha' }).id
  const beta = createProject({ name: 'Beta', clientId: contoso }).id
  const gamma = createProject({ name: 'Gamma' }).id
  const build = createActivity({ projectId: alpha, name: 'Build', clientId: fabrikam }).id
  const run = createActivity({ projectId: alpha, name: 'Run' }).id
  const ops = createActivity({ projectId: beta, name: 'Ops' }).id

  createTimeEntry({ activityId: build, date: '2026-03-02', durationSec: 1800 })
  createTimeEntry({ activityId: run, date: '2026-03-02', durationSec: 600 })
  createTimeEntry({ activityId: ops, date: '2026-03-02', durationSec: 1200 })
  return { contoso, fabrikam, alpha, beta, gamma, build, run, ops }
}

function effectiveClient(activityId: number): string | null {
  return getActivityDetails(activityId).client?.name ?? null
}

/** Asserts the minutes per client, which must add up to the total of all entries. */
function expectMinutesByClient(expected: Record<string, number>): void {
  const byClient = Object.fromEntries(
    aggregate({}, ['client']).map((row) => [row.client?.name ?? NO_CLIENT, row.totalSec / 60])
  )
  const totalMin = aggregate({}, [])[0].totalSec / 60

  expect(byClient).toEqual(expected)
  expect(Object.values(byClient).reduce((sum, minutes) => sum + minutes, 0)).toBe(totalMin)
}

beforeEach(() => {
  activateDatabase(createTestProfile())
  ids = seed()
})

afterAll(() => closeActiveDatabase())

it('counts the client of a project for all its activities, else their own', () => {
  expect(effectiveClient(ids.ops)).toBe('Contoso')
  expect(effectiveClient(ids.build)).toBe('Fabrikam')
  expect(effectiveClient(ids.run)).toBeNull()
  expectMinutesByClient({ Contoso: 20, Fabrikam: 30, [NO_CLIENT]: 10 })
})

describe('client of a project', () => {
  it('replaces the clients of its activities when set', () => {
    updateProject(ids.alpha, { clientId: ids.contoso })

    expect(findActivity(ids.build).clientId).toBeNull()
    expect(findActivity(ids.run).clientId).toBeNull()
    expect(effectiveClient(ids.build)).toBe('Contoso')
    expect(effectiveClient(ids.run)).toBe('Contoso')
    expectMinutesByClient({ Contoso: 60 })
  })

  it('is handed down to its activities when removed', () => {
    updateProject(ids.beta, { clientId: null })

    expect(findActivity(ids.ops).clientId).toBe(ids.contoso)
    expect(effectiveClient(ids.ops)).toBe('Contoso')
    expectMinutesByClient({ Contoso: 20, Fabrikam: 30, [NO_CLIENT]: 10 })
  })

  it('applies to all its activities when changed', () => {
    updateProject(ids.beta, { clientId: ids.fabrikam })

    expect(effectiveClient(ids.ops)).toBe('Fabrikam')
    expectMinutesByClient({ Fabrikam: 50, [NO_CLIENT]: 10 })
  })

  it('leaves the clients of the activities alone when the project changes otherwise', () => {
    updateProject(ids.alpha, { name: 'Alpha 2' })

    expect(findActivity(ids.build).clientId).toBe(ids.fabrikam)
    expectMinutesByClient({ Contoso: 20, Fabrikam: 30, [NO_CLIENT]: 10 })
  })
})

describe('moving an activity', () => {
  it('keeps the client of its former project', () => {
    moveActivity(ids.ops, ids.gamma, 'Ops')

    expect(findActivity(ids.ops).clientId).toBe(ids.contoso)
    expect(effectiveClient(ids.ops)).toBe('Contoso')
    expectMinutesByClient({ Contoso: 20, Fabrikam: 30, [NO_CLIENT]: 10 })
  })

  it('keeps its own client between projects without one', () => {
    moveActivity(ids.build, ids.gamma, 'Build')

    expect(effectiveClient(ids.build)).toBe('Fabrikam')
  })

  it('takes the client of a new project that has one', () => {
    moveActivity(ids.build, ids.beta, 'Build')

    expect(findActivity(ids.build).clientId).toBeNull()
    expect(effectiveClient(ids.build)).toBe('Contoso')
    expectMinutesByClient({ Contoso: 50, [NO_CLIENT]: 10 })
  })
})

describe('client of an activity', () => {
  it('can be set in a project without a client', () => {
    setActivityClient(ids.run, ids.contoso)

    expect(effectiveClient(ids.run)).toBe('Contoso')
    expectMinutesByClient({ Contoso: 30, Fabrikam: 30 })
  })

  it('cannot be set in a project with a client', () => {
    expect(() => setActivityClient(ids.ops, ids.fabrikam)).toThrow(
      expect.objectContaining({ code: 'CLIENT_SET_BY_PROJECT' })
    )
    expect(() =>
      createActivity({ projectId: ids.beta, name: 'Support', clientId: ids.fabrikam })
    ).toThrow(expect.objectContaining({ code: 'CLIENT_SET_BY_PROJECT' }))
    expect(effectiveClient(ids.ops)).toBe('Contoso')
  })
})
