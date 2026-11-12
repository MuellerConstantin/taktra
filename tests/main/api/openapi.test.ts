import type { z } from '@hono/zod-openapi'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '@/main/api/app'
import { ActivityV1 } from '@/main/api/v1/dto/activities'
import { ClientV1 } from '@/main/api/v1/dto/clients'
import { CustomFieldV1 } from '@/main/api/v1/dto/customFields'
import { ExportRowV1, ExportTemplateV1 } from '@/main/api/v1/dto/exportTemplates'
import { ProjectV1 } from '@/main/api/v1/dto/projects'
import { ReportRowV1 } from '@/main/api/v1/dto/reports'
import { TagV1 } from '@/main/api/v1/dto/tags'
import { TimeEntryV1 } from '@/main/api/v1/dto/timeEntries'
import { V1_PATH } from '@/main/api/v1'
import {
  activities,
  apiAccess,
  clients,
  customFields,
  exportTemplates,
  projects,
  tags,
  timeEntries
} from '@/main/core'
import { activateDatabase, closeActiveDatabase } from '@/main/core/db/database'
import { createTestProfile } from '../../profiles'

const PORT = 47011
const app = createApp(() => PORT)
const host = `127.0.0.1:${PORT}`
const SPEC_PATH = `${V1_PATH}/openapi.json`

let key: string

interface Spec {
  readonly openapi: string
  readonly paths: Record<string, Record<string, Operation>>
  readonly components: { readonly schemas: Record<string, unknown> }
}

interface Operation {
  readonly summary?: string
  readonly tags?: readonly string[]
  readonly responses: Record<string, unknown>
}

async function spec(): Promise<Spec> {
  return (await (await app.request(SPEC_PATH, { headers: { host } })).json()) as Spec
}

async function get(path: string): Promise<unknown> {
  const response = await app.request(`/api/v1${path}`, {
    headers: { host, authorization: `Bearer ${key}` }
  })
  expect(response.status, path).toBe(200)
  return response.json()
}

beforeAll(() => {
  activateDatabase(createTestProfile())
  key = apiAccess.createKey()
  const client = clients.create({ name: 'Contoso' })
  const project = projects.create({ name: 'Alpha', color: '#a855f7', clientId: client.id })
  const tag = tags.create({ name: 'Meeting' })
  const activity = activities.create({ projectId: project.id, name: 'Build' })
  activities.setTags(activity.id, [tag.id])
  const field = customFields.create({ scope: 'project', type: 'select', name: 'Billing' })
  const option = customFields.createOption(field.id, 'Flat rate')
  customFields.setValues('project', project.id, [
    { fieldId: field.id, textValue: null, optionId: option.id }
  ])
  timeEntries.create({ activityId: activity.id, date: '2026-03-02', durationSec: 600 })
  exportTemplates.create({
    name: 'Billing',
    format: 'csv',
    layout: 'entries',
    columns: [{ builtin: 'date' }, { fieldId: field.id, header: 'Billing' }]
  })
})

afterAll(() => closeActiveDatabase())

describe('the description', () => {
  it('is served without the key, but still only to local programs', async () => {
    const response = await app.request(SPEC_PATH, { headers: { host } })
    expect(response.status).toBe(200)
    expect((await spec()).openapi).toBe('3.1.0')

    const fromBrowser = await app.request(SPEC_PATH, {
      headers: { host, origin: 'https://example.com' }
    })
    expect(fromBrowser.status).toBe(403)
  })

  it('documents every route the API serves', async () => {
    const served = app.routes
      .filter((route) => route.method !== 'ALL' && route.path !== SPEC_PATH)
      .map((route) => `${route.method} ${route.path.replace(/:(\w+)/g, '{$1}')}`)
    const documented = Object.entries((await spec()).paths).flatMap(([path, operations]) =>
      Object.keys(operations).map((method) => `${method.toUpperCase()} ${V1_PATH}${path}`)
    )
    expect([...new Set(served)].sort()).toEqual([...new Set(documented)].sort())
  })

  it('gives every operation a summary, a tag and its error responses', async () => {
    for (const [path, operations] of Object.entries((await spec()).paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        const name = `${method} ${path}`
        expect(operation.summary, name).toBeTruthy()
        expect(operation.tags?.length, name).toBeGreaterThan(0)
        expect(Object.keys(operation.responses), name).toContain('401')
      }
    }
  })
})

describe('the responses', () => {
  /** Parsing drops unknown fields, so equality also catches fields the description lacks. */
  async function expectShape(path: string, schema: z.ZodType): Promise<void> {
    const body = await get(path)
    expect(schema.parse(body), path).toEqual(body)
  }

  it('match their schemas exactly', async () => {
    const [project] = projects.list()
    await expectShape('/projects', ProjectV1.array())
    await expectShape(`/projects/${project.id}`, ProjectV1)
    await expectShape('/activities', ActivityV1.array())
    await expectShape('/clients', ClientV1.array())
    await expectShape('/tags', TagV1.array())
    await expectShape('/custom-fields', CustomFieldV1.array())
    await expectShape('/time-entries', TimeEntryV1.array())
    await expectShape('/reports?groupBy=client,project,activity,tag,date', ReportRowV1.array())
    await expectShape('/export-templates', ExportTemplateV1.array())
    const [template] = exportTemplates.list()
    await expectShape(`/export-templates/${template.id}/file?format=json`, ExportRowV1.array())
  })
})
