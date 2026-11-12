import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '@/main/api/app'
import {
  activities,
  apiAccess,
  customFields,
  exportTemplates,
  projects,
  tags,
  timeEntries,
  timer
} from '@/main/core'
import { activateDatabase, closeActiveDatabase } from '@/main/core/db/database'
import { getEnvironment } from '@/main/core/environment'
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

  it('searches activities by the words of their name and project name', async () => {
    const search = async (text: string): Promise<unknown> =>
      ((await (await request(`/api/v1/activities?search=${text}`)).json()) as { id: number }[]).map(
        (activity) => activity.id
      )
    expect(await search('ALPHA%20bui')).toEqual([ids.activity])
    expect(await search('build%20beta')).toEqual([])
    expect(await search('')).toEqual([ids.activity])
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
    expect(started.status).toBe(201)
    expect(await started.json()).toMatchObject({ end: null, note: 'From a script' })
    expect(await (await request('/api/v1/timer')).json()).not.toBeNull()

    await request('/api/v1/timer/stop', { method: 'POST' })
    expect(await (await request('/api/v1/timer')).json()).toBeNull()
    const entries = (await (await request('/api/v1/time-entries')).json()) as { end: string }[]
    expect(entries).toHaveLength(1)
    expect(entries[0].end).toMatch(/Z$/)
  })

  it('lists the recently used activities with their project and tags', async () => {
    const response = await request('/api/v1/timer/recent?limit=5')
    expect(await response.json()).toEqual([
      {
        activity: { id: ids.activity, name: 'Build', archivedAt: null },
        project: { id: ids.project, name: 'Alpha', color: null, archivedAt: null },
        client: null,
        tags: [{ id: ids.tag, name: 'Meeting', color: null }]
      }
    ])
    expect((await request('/api/v1/timer/recent?limit=51')).status).toBe(400)
  })

  it('tells what is wrong with invalid input', async () => {
    const response = await request('/api/v1/timer/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'No activity' })
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'VALIDATION_FAILED',
        issues: [{ path: 'activityId', message: expect.any(String) }]
      }
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

  it('sends an event when profile data changes, whoever writes it', async () => {
    const response = await request('/api/v1/events')
    const reader = response.body!.getReader()

    tags.create({ name: 'Support' })
    const { value } = await reader.read()
    expect(new TextDecoder().decode(value)).toContain('event: signal:data')

    await reader.cancel()
  })

  it('sends an event when the timer changes', async () => {
    const response = await request('/api/v1/events')
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    const reader = response.body!.getReader()

    timer.start(ids.activity)
    const { value } = await reader.read()
    expect(new TextDecoder().decode(value)).toContain('event: signal:timer')

    await reader.cancel()
    timer.stop()
  })
})

describe('export', () => {
  const period = 'from=2026-03-02&to=2026-03-04'
  let templateId: number

  beforeAll(() => {
    timeEntries.create({ activityId: ids.activity, date: '2026-03-02', durationSec: 90 * 60 })
    timeEntries.create({ activityId: ids.activity, date: '2026-03-03', durationSec: 30 * 60 })
    templateId = exportTemplates.create({
      name: 'Time sheet',
      format: 'csv',
      layout: 'pivot',
      columns: [{ builtin: 'project' }, { builtin: 'duration_h' }]
    }).id
  })

  it('writes the file of a template in its own format', async () => {
    const response = await request(`/api/v1/export-templates/${templateId}/file?${period}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="taktra_2026-03-02_2026-03-04.csv"'
    )
    expect(await response.text()).toBe(
      'project,2026-03-02,2026-03-03,2026-03-04\r\nAlpha,1.5,0.5,\r\n'
    )
  })

  it('writes the same rows as JSON or Excel on request', async () => {
    const asJson = await request(
      `/api/v1/export-templates/${templateId}/file?${period}&format=json`
    )
    expect(asJson.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(await asJson.json()).toEqual([
      { project: 'Alpha', '2026-03-02': 1.5, '2026-03-03': 0.5, '2026-03-04': null }
    ])

    const asXlsx = await request(
      `/api/v1/export-templates/${templateId}/file?${period}&format=xlsx`
    )
    expect(asXlsx.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    expect(new TextDecoder().decode((await asXlsx.arrayBuffer()).slice(0, 2))).toBe('PK')
  })

  it('applies the filter and refuses a missing template or format', async () => {
    const other = projects.create({ name: 'Beta' }).id
    const filtered = await request(
      `/api/v1/export-templates/${templateId}/file?${period}&projectIds=${other}&format=json`
    )
    expect(await filtered.json()).toEqual([])

    const missing = await request(`/api/v1/export-templates/999/file?${period}`)
    expect([missing.status, await errorCode(missing)]).toEqual([404, 'EXPORT_TEMPLATE_NOT_FOUND'])
    const wrongFormat = await request(`/api/v1/export-templates/${templateId}/file?format=pdf`)
    expect([wrongFormat.status, await errorCode(wrongFormat)]).toEqual([400, 'VALIDATION_FAILED'])
  })
})
