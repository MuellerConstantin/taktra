/*
 * The response format of /api/v1. It is a stable contract for other programs, so it is mapped
 * explicitly from the model types, which may change with the app. Dates are ISO 8601 in UTC.
 */

export type Timestamp = string

export function timestamp(date: Date | null): Timestamp | null {
  return date === null ? null : date.toISOString()
}

export interface RefV1 {
  readonly id: number
  readonly name: string
}

export function toRef(value: RefV1 | null): RefV1 | null {
  return value && { id: value.id, name: value.name }
}
