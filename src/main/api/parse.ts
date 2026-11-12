import type { z } from 'zod'
import { AppError } from '@/shared/model/errors'

/** A failed check of a request, with one issue per wrong field. */
export function invalidRequest(error: z.ZodError): AppError {
  const issues = error.issues.map(({ path, message }) => ({
    path: path.filter((key) => typeof key !== 'symbol'),
    message
  }))
  return new AppError('VALIDATION_FAILED', issues.map((issue) => issue.message).join('; '), issues)
}

/** Validates with the schemas of shared/validation/, as the IPC handlers do. */
export function parse<Schema extends z.ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw invalidRequest(parsed.error)
  return parsed.data
}
