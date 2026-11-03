import type { Client } from '../../../shared/model/clients'
import { timestamp, type Timestamp } from './common'
import type { CustomFieldValueV1 } from './customFields'

export interface ClientV1 {
  readonly id: number
  readonly name: string
  readonly archivedAt: Timestamp | null
  readonly customFields: readonly CustomFieldValueV1[]
}

export function toClient(client: Client, customFields: readonly CustomFieldValueV1[]): ClientV1 {
  return {
    id: client.id,
    name: client.name,
    archivedAt: timestamp(client.archivedAt),
    customFields
  }
}
