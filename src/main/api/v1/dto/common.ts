import { z } from '@hono/zod-openapi'
import { name } from '../../../../shared/validation'

/*
 * The response format of /api/v1. It is a stable contract for other programs, so it is mapped
 * explicitly from the model types, which may change with the app. Dates are ISO 8601 in UTC.
 */

export const TimestampV1 = z.iso.datetime().openapi({ example: '2026-03-02T08:00:00.000Z' })

export type Timestamp = z.infer<typeof TimestampV1>

export function timestamp(date: Date | null): Timestamp | null {
  return date === null ? null : date.toISOString()
}

export const RefV1 = z.object({ id: z.number().int(), name: z.string() }).openapi('Ref')

export type RefV1 = z.infer<typeof RefV1>

export function toRef(value: RefV1 | null): RefV1 | null {
  return value && { id: value.id, name: value.name }
}

export const NameInputV1 = z.object({ name }).strict().openapi('NameInput')
