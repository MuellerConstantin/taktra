import type { Client } from '../../../shared/model/clients'
import { timestamp, type Timestamp } from './common'

export interface ClientV1 {
  readonly id: number
  readonly name: string
  readonly archivedAt: Timestamp | null
}

export function toClient(client: Client): ClientV1 {
  return { id: client.id, name: client.name, archivedAt: timestamp(client.archivedAt) }
}
