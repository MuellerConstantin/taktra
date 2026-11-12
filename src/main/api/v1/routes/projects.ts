import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import type { Project } from '@/shared/model/projects'
import { projectInput } from '@/shared/validation'
import { projects } from '@/main/core'
import { ProjectV1, toProject } from '@/main/api/v1/dto/projects'
import { json, jsonBody, noContent } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { booleanQuery, idParams } from '@/main/api/v1/params'
import { registerArchiveRoutes } from './archive'
import { fieldValuesOf, registerFieldValueRoutes } from './customFields'

const tags = ['Projects']

function present(project: Project): ProjectV1 {
  return toProject(project, fieldValuesOf('project')(project.id))
}

const list = createRoute({
  method: 'get',
  path: '/projects',
  tags,
  summary: 'List projects',
  request: { query: z.object({ includeArchived: booleanQuery }) },
  responses: { 200: json(z.array(ProjectV1), 'The projects, sorted by name'), ...errors(400) }
})

const get = createRoute({
  method: 'get',
  path: '/projects/{id}',
  tags,
  summary: 'Get a project',
  request: { params: idParams },
  responses: { 200: json(ProjectV1, 'The project'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/projects',
  tags,
  summary: 'Create a project',
  request: { body: jsonBody(projectInput) },
  responses: { 201: json(ProjectV1, 'The new project'), ...errors(400, 404, 409) }
})

const update = createRoute({
  method: 'patch',
  path: '/projects/{id}',
  tags,
  summary: 'Change a project',
  description:
    'Changes the given fields. Setting a client clears the clients of its activities; removing it hands it down to them.',
  request: { params: idParams, body: jsonBody(projectInput.partial()) },
  responses: { 200: json(ProjectV1, 'The changed project'), ...errors(400, 404, 409) }
})

const remove = createRoute({
  method: 'delete',
  path: '/projects/{id}',
  tags,
  summary: 'Delete a project',
  description: 'Only possible without booked time; otherwise archive it.',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404, 409) }
})

export function registerProjectRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => {
    const valuesOf = fieldValuesOf('project')
    const found = projects.list(c.req.valid('query'))
    return c.json(
      found.map((project) => toProject(project, valuesOf(project.id))),
      200
    )
  })
  v1.openapi(get, (c) => c.json(present(projects.get(c.req.valid('param').id)), 200))
  v1.openapi(create, (c) => c.json(present(projects.create(c.req.valid('json'))), 201))
  v1.openapi(update, (c) =>
    c.json(present(projects.update(c.req.valid('param').id, c.req.valid('json'))), 200)
  )
  v1.openapi(remove, (c) => {
    projects.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, {
    path: '/projects',
    tags,
    noun: 'project',
    schema: ProjectV1,
    setArchived: projects.setArchived,
    present
  })
  registerFieldValueRoutes(v1, { path: '/projects', tags, noun: 'project', scope: 'project' })
}
