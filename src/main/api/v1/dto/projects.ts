import { z } from '@hono/zod-openapi'
import type { Project } from '@/shared/model/projects'
import { timestamp, TimestampV1 } from './common'
import { CustomFieldValueV1 } from './customFields'

export const ProjectV1 = z
  .object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().nullable(),
    color: z.string().nullable().openapi({ example: '#a855f7' }),
    clientId: z.number().int().nullable(),
    archivedAt: TimestampV1.nullable(),
    customFields: z.array(CustomFieldValueV1)
  })
  .openapi('Project')

export type ProjectV1 = z.infer<typeof ProjectV1>

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
    customFields: [...customFields]
  }
}
