import { z } from '@hono/zod-openapi'
import type { Client } from '@/shared/model/clients'
import { timestamp, TimestampV1 } from './common'
import { CustomFieldValueV1 } from './customFields'

export const ClientV1 = z
  .object({
    id: z.number().int(),
    name: z.string(),
    archivedAt: TimestampV1.nullable(),
    customFields: z.array(CustomFieldValueV1)
  })
  .openapi('Client')

export type ClientV1 = z.infer<typeof ClientV1>

export function toClient(client: Client, customFields: readonly CustomFieldValueV1[]): ClientV1 {
  return {
    id: client.id,
    name: client.name,
    archivedAt: timestamp(client.archivedAt),
    customFields: [...customFields]
  }
}
