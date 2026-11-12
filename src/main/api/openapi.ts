import type { z } from '@hono/zod-openapi'

export function json<Schema extends z.ZodType>(
  schema: Schema,
  description: string
): { content: { 'application/json': { schema: Schema } }; description: string } {
  return { content: { 'application/json': { schema } }, description }
}

export function jsonBody<Schema extends z.ZodType>(
  schema: Schema
): { content: { 'application/json': { schema: Schema } }; required: true } {
  return { content: { 'application/json': { schema } }, required: true }
}

export const noContent = { description: 'Done; the response has no body' }
