import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../../src/main/api/app'
import { activities, apiAccess, customFields, projects, tags, timer } from '../../../src/main/core'
import { activateDatabase, closeActiveDatabase } from '../../../src/main/core/db/database'
import { getEnvironment } from '../../../src/main/core/environment'
import { createTestProfile } from '../../profiles'

const PORT = 47011
const app = createApp(() => PORT)

let key: string
let ids: { readonly project: number; readonly activity: number; readonly tag: number }

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return Promise.resolve(
    app.request(path, {
      ...init,
      headers: {
        host: `127.0.0.1:${PORT}`,
        authorization: `Bearer ${key}`,
        ...(init.headers as Record<string, string>)
      }
    })
  )
}

async function errorCode(response: Response): Promise<string> {
  return ((await response.json()) as { error: { code: string } }).error.code
}

beforeAll(() => {
  activateDatabase(createTestProfile())
  const project = projects.create({ name: 'Alpha' }).id
  const tag = tags.create({ name: 'Meeting' }).id
  const activity = activities.create({ projectId: project, name: 'Build' }).id
  activities.setTags(activity, [tag])
  ids = { project, activity, tag }
})

afterAll(() => closeActiveDatabase())

describe('access', () => {
  it('refuses every request before a key exists', async () => {
    key = 'anything'
    const response = await request('/api/v1/projects')
    expect(response.status).toBe(401)
    expect(await errorCode(response)).toBe('UNAUTHORIZED')
  })

  it('stores only the hash of the key, and a new key replaces the old one', async () => {
    const first = apiAccess.createKey()
    key = apiAccess.createKey()
    const stored = readFileSync(join(getEnvironment().userDataPath, 'api.json'), 'utf8')
    expect(stored).not.toContain(key)
    expect(apiAccess.verifyKey(first)).toBe(false)
    expect(apiAccess.verifyKey(key)).toBe(true)
  })

  it('refuses a wrong key, a browser origin and a foreign host', async () => {
    expect(
      (await request('/api/v1/projects', { headers: { authorization: 'Bearer x' } })).status
    ).toBe(401)
    expect(
      (await request('/api/v1/projects', { headers: { origin: 'https://example.com' } })).status
    ).toBe(403)
    const rebound = await request('/api/v1/projects', { headers: { host: `evil.test:${PORT}` } })
    expect(rebound.status).toBe(400)
    expect(await errorCode(rebound)).toBe('INVALID_HOST')
  })
})

describe('reading', () => {
  it('lists projects without internal columns', async () => {
    const response = await request('/api/v1/projects')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      {
        id: ids.project,
        name: 'Alpha',
        description: null,
        color: null,
        clientId: null,
        archivedAt: null,
        customFields: []
      }
    ])
  })

  it('returns an activity in the same shape as the list', async () => {
    const list = (await (await request('/api/v1/activities')).json()) as unknown[]
    const single = await (await request(`/api/v1/activities/${ids.activity}`)).json()
    expect(list).toEqual([single])
    expect(single).toMatchObject({ tagIds: [ids.tag], projectId: ids.project })
  })

  it('maps errors of the core and of the request to their status', async () => {
    const missing = await request('/api/v1/projects/999')
    expect([missing.status, await errorCode(missing)]).toEqual([404, 'PROJECT_NOT_FOUND'])
    const invalid = await request('/api/v1/projects/abc')
    expect([invalid.status, await errorCode(invalid)]).toEqual([400, 'VALIDATION_FAILED'])
    const unknown = await request('/api/v1/nothing')
    expect([unknown.status, await errorCode(unknown)]).toEqual([404, 'ROUTE_NOT_FOUND'])
    const profile = await request('/api/v1/profile')
    expect([profile.status, await errorCode(profile)]).toEqual([409, 'NO_ACTIVE_PROFILE'])
  })
})

describe('custom fields', () => {
  it('lists the fields and embeds their values in the owners', async () => {
    const costCenter = customFields.create({ scope: 'project', type: 'text', name: 'Cost center' })
    const billing = customFields.create({ scope: 'activity', type: 'select', name: 'Billing' })
    const flatRate = customFields.createOption(billing.id, 'Flat rate')
    customFields.setValues('project', ids.project, [
      { fieldId: costCenter.id, textValue: '4711', optionId: null }
    ])
    customFields.setValues('activity', ids.activity, [
      { fieldId: billing.id, textValue: null, optionId: flatRate.id }
    ])

    const fields = await (await request('/api/v1/custom-fields')).json()
    expect(fields).toEqual([
      expect.objectContaining({
        name: 'Billing',
        type: 'select',
        options: [expect.objectContaining({ name: 'Flat rate' })]
      }),
      expect.objectContaining({ name: 'Cost center', type: 'text', options: [] })
    ])
    const project = await (await request(`/api/v1/projects/${ids.project}`)).json()
    expect(project.customFields).toEqual([
      { fieldId: costCenter.id, name: 'Cost center', value: '4711', optionId: null }
    ])
    const [activity] = (await (await request('/api/v1/activities')).json()) as {
      customFields: unknown
    }[]
    expect(activity.customFields).toEqual([
      { fieldId: billing.id, name: 'Billing', value: 'Flat rate', optionId: flatRate.id }
    ])
  })

  it('filters the fields by scope', async () => {
    const fields = (await (await request('/api/v1/custom-fields?scope=project')).json()) as {
      scope: string
    }[]
    expect(fields.map((field) => field.scope)).toEqual(['project'])
    const invalid = await request('/api/v1/custom-fields?scope=entry')
    expect([invalid.status, await errorCode(invalid)]).toEqual([400, 'VALIDATION_FAILED'])
  })
})

describe('timer', () => {
  it('starts and stops the timer', async () => {
    const started = await request('/api/v1/timer/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ activityId: ids.activity, note: 'From a script' })
    })
    expect(started.status).toBe(200)
    expect(await started.json()).toMatchObject({ end: null, note: 'From a script' })
    expect(await (await request('/api/v1/timer')).json()).not.toBeNull()

    await request('/api/v1/timer/stop', { method: 'POST' })
    expect(await (await request('/api/v1/timer')).json()).toBeNull()
    const entries = (await (await request('/api/v1/time-entries')).json()) as { end: string }[]
    expect(entries).toHaveLength(1)
    expect(entries[0].end).toMatch(/Z$/)
  })

  it('tells what is wrong with invalid input', async () => {
    const response = await request('/api/v1/timer/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'No activity' })
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: { code: 'VALIDATION_FAILED', message: expect.stringContaining('activityId') }
    })
  })

  it('refuses a body that is not JSON', async () => {
    const response = await request('/api/v1/timer/start', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'activityId=1'
    })
    expect([response.status, await errorCode(response)]).toEqual([415, 'UNSUPPORTED_MEDIA_TYPE'])
  })

  it('sends an event when the timer changes', async () => {
    const response = await request('/api/v1/events')
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    const reader = response.body!.getReader()

    timer.start(ids.activity)
    const { value } = await reader.read()
    expect(new TextDecoder().decode(value)).toContain('event: timer')

    await reader.cancel()
    timer.stop()
  })
})
