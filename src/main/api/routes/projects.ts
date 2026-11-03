import type { Hono } from 'hono'
import type { Project } from '../../../shared/model/projects'
import { listOptions, projectInput } from '../../../shared/validation'
import { projects } from '../../core'
import { toProject } from '../dto/projects'
import { idParam, parse, readBody, toBoolean } from '../parse'
import { registerArchiveRoutes } from './archive'
import { fieldValuesOf, registerFieldValueRoutes } from './customFields'

function present(project: Project): ReturnType<typeof toProject> {
  return toProject(project, fieldValuesOf('project')(project.id))
}

export function registerProjectRoutes(v1: Hono): void {
  v1.get('/projects', (c) => {
    const options = parse(listOptions, {
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    const valuesOf = fieldValuesOf('project')
    return c.json(projects.list(options).map((project) => toProject(project, valuesOf(project.id))))
  })
  v1.get('/projects/:id', (c) => c.json(present(projects.get(idParam(c)))))
  v1.post('/projects', async (c) =>
    c.json(present(projects.create(parse(projectInput, await readBody(c)))), 201)
  )
  v1.patch('/projects/:id', async (c) =>
    c.json(present(projects.update(idParam(c), parse(projectInput.partial(), await readBody(c)))))
  )
  v1.delete('/projects/:id', (c) => {
    projects.delete(idParam(c))
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, '/projects', projects.setArchived, present)
  registerFieldValueRoutes(v1, '/projects', 'project')
}
