import { z } from 'zod'
import { id, listOptions, projectInput } from '@/shared/validation'
import { projects } from '@/main/core'
import { handle } from './handle'

export function registerProjectsHandlers(): void {
  handle('projects:list', z.tuple([listOptions]), (_, options) => projects.list(options))
  handle('projects:get', z.tuple([id]), (_, projectId) => projects.get(projectId))
  handle('projects:create', z.tuple([projectInput]), (_, input) => projects.create(input))
  handle('projects:update', z.tuple([id, projectInput.partial()]), (_, projectId, patch) =>
    projects.update(projectId, patch)
  )
  handle('projects:setArchived', z.tuple([id, z.boolean()]), (_, projectId, archived) =>
    projects.setArchived(projectId, archived)
  )
  handle('projects:delete', z.tuple([id]), (_, projectId) => projects.delete(projectId))
}
