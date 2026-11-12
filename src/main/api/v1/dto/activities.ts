import { z } from '@hono/zod-openapi'
import type { ActivityWithTags } from '@/shared/model/activities'
import type { ActivityDetails } from '@/shared/model/timeEntries'
import { id, name } from '@/shared/validation'
import { RefV1, timestamp, TimestampV1, toRef } from './common'
import { CustomFieldValueV1 } from './customFields'
import { TagV1, toTag } from './tags'

export const ActivityV1 = z
  .object({
    id: z.number().int(),
    projectId: z.number().int(),
    name: z.string(),
    clientId: z.number().int().nullable().openapi({
      description: 'The client of the activity itself; a client of its project takes precedence.'
    }),
    tagIds: z.array(z.number().int()),
    archivedAt: TimestampV1.nullable(),
    customFields: z.array(CustomFieldValueV1)
  })
  .openapi('Activity')

export type ActivityV1 = z.infer<typeof ActivityV1>

export function toActivity(
  activity: ActivityWithTags,
  customFields: readonly CustomFieldValueV1[]
): ActivityV1 {
  return {
    id: activity.id,
    projectId: activity.projectId,
    name: activity.name,
    clientId: activity.clientId,
    tagIds: [...activity.tagIds],
    archivedAt: timestamp(activity.archivedAt),
    customFields: [...customFields]
  }
}

export const ActivityDetailsV1 = z.object({
  activity: RefV1.extend({ archivedAt: TimestampV1.nullable() }),
  project: RefV1.extend({ color: z.string().nullable(), archivedAt: TimestampV1.nullable() }),
  client: RefV1.nullable().openapi({
    description: 'The effective client: the client of the project, else that of the activity.'
  }),
  tags: z.array(TagV1)
})

export type ActivityDetailsV1 = z.infer<typeof ActivityDetailsV1>

export function toActivityDetails(details: ActivityDetails): ActivityDetailsV1 {
  return {
    activity: {
      id: details.activity.id,
      name: details.activity.name,
      archivedAt: timestamp(details.activity.archivedAt)
    },
    project: {
      id: details.project.id,
      name: details.project.name,
      color: details.project.color,
      archivedAt: timestamp(details.project.archivedAt)
    },
    client: toRef(details.client),
    tags: details.tags.map(toTag)
  }
}

export const ActivityTagsInputV1 = z
  .object({ tagIds: z.array(id) })
  .strict()
  .openapi('ActivityTagsInput')

export const ActivityClientInputV1 = z
  .object({ clientId: id.nullable() })
  .strict()
  .openapi('ActivityClientInput')

export const ActivityMoveInputV1 = z
  .object({ projectId: id, name: name.optional() })
  .strict()
  .openapi('ActivityMoveInput')

export const ActivityMergeInputV1 = z
  .object({ targetId: id })
  .strict()
  .openapi('ActivityMergeInput')
