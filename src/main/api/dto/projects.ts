import type { Project } from '../../../shared/model/projects'
import { timestamp, type Timestamp } from './common'

export interface ProjectV1 {
  readonly id: number
  readonly name: string
  readonly description: string | null
  readonly color: string | null
  readonly clientId: number | null
  readonly archivedAt: Timestamp | null
}

export function toProject(project: Project): ProjectV1 {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    clientId: project.clientId,
    archivedAt: timestamp(project.archivedAt)
  }
}
