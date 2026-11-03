import type { Project } from '../../../shared/model/projects'
import { timestamp, type Timestamp } from './common'
import type { CustomFieldValueV1 } from './customFields'

export interface ProjectV1 {
  readonly id: number
  readonly name: string
  readonly description: string | null
  readonly color: string | null
  readonly clientId: number | null
  readonly archivedAt: Timestamp | null
  readonly customFields: readonly CustomFieldValueV1[]
}

export function toProject(
  project: Project,
  customFields: readonly CustomFieldValueV1[]
): ProjectV1 {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    clientId: project.clientId,
    archivedAt: timestamp(project.archivedAt),
    customFields
  }
}
