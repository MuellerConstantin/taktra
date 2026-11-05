import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../../src/main/api/app'
import { apiAccess } from '../../../src/main/core'
import { activateDatabase, closeActiveDatabase } from '../../../src/main/core/db/database'
import { createTestProfile } from '../../profiles'

const PORT = 47011
const app = createApp(() => PORT)

let key: string

// The assertions check the shape of each response, so its body is read without a type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

async function send(
  method: string,
  path: string,
  body?: unknown
): Promise<{ readonly status: number; readonly json: Json }> {
  const response = await app.request(`/api/v1${path}`, {
    method,
    headers: {
      host: `127.0.0.1:${PORT}`,
      authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const text = await response.text()
  return { status: response.status, json: text === '' ? undefined : JSON.parse(text) }
}

beforeAll(() => {
  activateDatabase(createTestProfile())
  key = apiAccess.createKey()
})

afterAll(() => closeActiveDatabase())

describe('projects, clients and tags', () => {
  it('creates, changes, archives and deletes a project', async () => {
    const created = await send('POST', '/projects', { name: 'Website', color: '#a855f7' })
    expect(created.status).toBe(201)
    expect(created.json).toMatchObject({ name: 'Website', color: '#a855f7', archivedAt: null })
    const projectId = created.json.id

    expect((await send('PATCH', `/projects/${projectId}`, { name: 'Web' })).json.name).toBe('Web')
    expect((await send('POST', `/projects/${projectId}/archive`)).json.archivedAt).not.toBeNull()
    expect((await send('POST', `/projects/${projectId}/unarchive`)).json.archivedAt).toBeNull()

    const taken = await send('POST', '/projects', { name: 'web' })
    expect([taken.status, taken.json.error.code]).toEqual([409, 'PROJECT_NAME_TAKEN'])

    expect((await send('DELETE', `/projects/${projectId}`)).status).toBe(204)
    expect((await send('GET', `/projects/${projectId}`)).status).toBe(404)
  })

  it('creates, changes and deletes a client and a tag', async () => {
    const client = await send('POST', '/clients', { name: 'Contoso' })
    expect(client.status).toBe(201)
    expect(
      (await send('PATCH', `/clients/${client.json.id}`, { name: 'Contoso AG' })).json.name
    ).toBe('Contoso AG')
    expect((await send('DELETE', `/clients/${client.json.id}`)).status).toBe(204)

    const tag = await send('POST', '/tags', { name: 'Support' })
    expect(tag.status).toBe(201)
    expect((await send('PATCH', `/tags/${tag.json.id}`, { color: '#ff0000' })).json.color).toBe(
      '#ff0000'
    )
    expect((await send('DELETE', `/tags/${tag.json.id}`)).status).toBe(204)
  })
})

describe('activities', () => {
  it('renames, tags, assigns, moves, merges and deletes activities', async () => {
    const alpha = (await send('POST', '/projects', { name: 'Alpha' })).json.id
    const beta = (await send('POST', '/projects', { name: 'Beta' })).json.id
    const client = (await send('POST', '/clients', { name: 'Fabrikam' })).json.id
    const tag = (await send('POST', '/tags', { name: 'Meeting' })).json.id

    const created = await send('POST', '/activities', { projectId: alpha, name: 'Build' })
    expect(created.status).toBe(201)
    const build = created.json.id

    expect((await send('PATCH', `/activities/${build}`, { name: 'Develop' })).json.name).toBe(
      'Develop'
    )
    expect((await send('PUT', `/activities/${build}/tags`, { tagIds: [tag] })).json.tagIds).toEqual(
      [tag]
    )
    expect(
      (await send('PUT', `/activities/${build}/client`, { clientId: client })).json.clientId
    ).toBe(client)

    const moved = await send('POST', `/activities/${build}/move`, { projectId: beta })
    expect(moved.json).toMatchObject({ projectId: beta, name: 'Develop' })

    const other = (await send('POST', '/activities', { projectId: beta, name: 'Review' })).json.id
    await send('POST', '/time-entries', { activityId: other, date: '2026-03-02', durationSec: 600 })
    const intoItself = await send('POST', `/activities/${other}/merge`, { targetId: other })
    expect([intoItself.status, intoItself.json.error.issues[0].path]).toEqual([400, 'targetId'])
    const merged = await send('POST', `/activities/${other}/merge`, { targetId: build })
    expect(merged.json.id).toBe(build)
    expect((await send('GET', `/activities/${other}`)).status).toBe(404)

    const withEntries = await send('DELETE', `/activities/${build}`)
    expect([withEntries.status, withEntries.json.error.code]).toEqual([
      409,
      'ACTIVITY_HAS_TIME_ENTRIES'
    ])
    expect((await send('POST', `/activities/${build}/archive`)).json.archivedAt).not.toBeNull()
    const archived = await send('POST', '/timer/start', { activityId: build })
    expect([archived.status, archived.json.error.code]).toEqual([409, 'ACTIVITY_ARCHIVED'])
  })
})

describe('time entries', () => {
  it('books, changes, annotates and deletes an entry', async () => {
    const project = (await send('POST', '/projects', { name: 'Gamma' })).json.id
    const activity = (await send('POST', '/activities', { projectId: project, name: 'Ops' })).json
      .id

    const created = await send('POST', '/time-entries', {
      activityId: activity,
      date: '2026-03-03',
      durationSec: 1800
    })
    expect(created.status).toBe(201)
    expect(created.json).toMatchObject({ date: '2026-03-03', durationSec: 1800, start: null })
    const entryId = created.json.id

    const replaced = await send('PUT', `/time-entries/${entryId}`, {
      activityId: activity,
      date: '2026-03-03',
      start: '2026-03-03T08:00:00.000Z',
      end: '2026-03-03T09:30:00.000Z',
      timezone: 'Europe/Berlin'
    })
    expect(replaced.json).toMatchObject({
      start: '2026-03-03T08:00:00.000Z',
      end: '2026-03-03T09:30:00.000Z',
      durationSec: 5400
    })

    const invalid = await send('PUT', `/time-entries/${entryId}`, {
      activityId: activity,
      date: '2026-03-03',
      start: 'yesterday',
      end: '2026-03-03T09:30:00.000Z',
      timezone: 'Europe/Berlin'
    })
    expect([invalid.status, invalid.json.error.issues[0].path]).toEqual([400, 'start'])

    const backwards = await send('PUT', `/time-entries/${entryId}`, {
      activityId: activity,
      date: '2026-03-03',
      start: '2026-03-03T09:30:00.000Z',
      end: '2026-03-03T08:00:00.000Z',
      timezone: 'Europe/Berlin'
    })
    expect(backwards.json).toEqual({
      error: { code: 'VALIDATION_FAILED', issues: [{ path: 'end', message: expect.any(String) }] }
    })

    expect(
      (await send('PUT', `/time-entries/${entryId}/note`, { note: '**Done**' })).json.note
    ).toBe('**Done**')
    expect((await send('DELETE', `/time-entries/${entryId}`)).status).toBe(204)
    expect((await send('GET', `/time-entries/${entryId}`)).status).toBe(404)
  })

  it('discards the running timer', async () => {
    const project = (await send('POST', '/projects', { name: 'Delta' })).json.id
    const activity = (await send('POST', '/activities', { projectId: project, name: 'Call' })).json
      .id
    expect((await send('POST', '/timer/start', { activityId: activity })).status).toBe(201)
    expect((await send('POST', '/timer/discard')).status).toBe(204)
    expect((await send('GET', '/timer')).json).toBeNull()
  })
})

describe('custom fields', () => {
  it('manages a select field, its options and the values of an owner', async () => {
    const field = await send('POST', '/custom-fields', {
      scope: 'project',
      type: 'select',
      name: 'Billing'
    })
    expect(field.status).toBe(201)
    const fieldId = field.json.id

    const option = await send('POST', `/custom-fields/${fieldId}/options`, { name: 'Flat' })
    expect(option.status).toBe(201)
    const optionId = option.json.id
    expect(
      (await send('PATCH', `/custom-field-options/${optionId}`, { name: 'Flat rate' })).json.name
    ).toBe('Flat rate')
    expect((await send('GET', `/custom-fields/${fieldId}`)).json.options).toEqual([
      expect.objectContaining({ id: optionId, name: 'Flat rate' })
    ])

    const project = (await send('POST', '/projects', { name: 'Epsilon' })).json.id
    const values = await send('PATCH', `/projects/${project}/custom-fields`, [
      { fieldId, optionId }
    ])
    expect(values.json).toEqual([{ fieldId, name: 'Billing', value: 'Flat rate', optionId }])

    const inUse = await send('DELETE', `/custom-fields/${fieldId}`)
    expect([inUse.status, inUse.json.error.code]).toEqual([409, 'CUSTOM_FIELD_IN_USE'])

    const text = await send('PATCH', `/projects/${project}/custom-fields`, [
      { fieldId, value: 'Flat' }
    ])
    expect([text.status, text.json.error.issues[0].path]).toEqual([400, '0.value'])

    const cleared = await send('PATCH', `/projects/${project}/custom-fields`, [
      { fieldId, optionId: null }
    ])
    expect(cleared.json).toEqual([])
    expect(
      (await send('POST', `/custom-field-options/${optionId}/archive`)).json.archivedAt
    ).not.toBeNull()
    const archivedOption = await send('PATCH', `/projects/${project}/custom-fields`, [
      { fieldId, optionId }
    ])
    expect([archivedOption.status, archivedOption.json.error.code]).toEqual([
      409,
      'CUSTOM_FIELD_OPTION_ARCHIVED'
    ])
    expect((await send('POST', `/custom-fields/${fieldId}/archive`)).json.archivedAt).not.toBeNull()
    const archivedField = await send('PATCH', `/projects/${project}/custom-fields`, [
      { fieldId, optionId }
    ])
    expect(archivedField.json.error.code).toBe('CUSTOM_FIELD_ARCHIVED')
    expect((await send('DELETE', `/custom-fields/${fieldId}`)).status).toBe(204)
  })
})

describe('export templates', () => {
  it('creates, replaces and deletes a template', async () => {
    const created = await send('POST', '/export-templates', {
      name: 'Billing',
      format: 'csv',
      layout: 'entries',
      columns: [{ builtin: 'date' }, { builtin: 'duration_min', header: 'Minutes' }]
    })
    expect(created.status).toBe(201)
    expect(created.json.columns).toEqual([
      { builtin: 'date', header: null, aggregation: null },
      { builtin: 'duration_min', header: 'Minutes', aggregation: null }
    ])

    const replaced = await send('PUT', `/export-templates/${created.json.id}`, {
      name: 'Billing',
      format: 'xlsx',
      layout: 'summed',
      columns: [{ builtin: 'project' }, { builtin: 'duration_h' }]
    })
    expect(replaced.json).toMatchObject({ format: 'xlsx', layout: 'summed' })
    expect((await send('GET', '/export-templates')).json).toHaveLength(1)
    expect((await send('DELETE', `/export-templates/${created.json.id}`)).status).toBe(204)
  })
})
