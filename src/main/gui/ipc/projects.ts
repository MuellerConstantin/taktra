import { z } from 'zod'
import { id, listOptions, projectInput } from '../../../shared/validation'
import {
  createProject,
  deleteProject,
  findProject,
  listProjects,
  setProjectArchived,
  updateProject
} from '../../core/domain/projects'
import { handle } from './handle'

export function initProjects(): void {
  handle('projects:list', z.tuple([listOptions]), (_, options) => listProjects(options))
  handle('projects:get', z.tuple([id]), (_, projectId) => findProject(projectId))
  handle('projects:create', z.tuple([projectInput]), (_, input) => createProject(input))
  handle('projects:update', z.tuple([id, projectInput.partial()]), (_, projectId, patch) =>
    updateProject(projectId, patch)
  )
  handle('projects:setArchived', z.tuple([id, z.boolean()]), (_, projectId, archived) =>
    setProjectArchived(projectId, archived)
  )
  handle('projects:delete', z.tuple([id]), (_, projectId) => deleteProject(projectId))
}
