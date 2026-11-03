import type { Hono } from 'hono'
import { listOptions } from '../../../shared/validation'
import { projects } from '../../core'
import { toProject } from '../dto/projects'
import { idParam, parse, toBoolean } from '../parse'
import { fieldValuesOf } from './customFields'

export function registerProjectRoutes(v1: Hono): void {
  v1.get('/projects', (c) => {
    const options = parse(listOptions, {
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    const valuesOf = fieldValuesOf('project')
    return c.json(projects.list(options).map((project) => toProject(project, valuesOf(project.id))))
  })
  v1.get('/projects/:id', (c) => {
    const project = projects.get(idParam(c))
    return c.json(toProject(project, fieldValuesOf('project')(project.id)))
  })
}
