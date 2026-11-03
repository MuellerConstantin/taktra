import type { z } from 'zod'
import { ValidationError } from './errors'

/** All problems in one line, such as `activityId: Invalid input: expected number, received undefined`. */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ` : '') + issue.message)
    .join('; ')
}

/** Validates with the schemas of shared/validation/, as the IPC handlers do. */
export function parse<Schema extends z.ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ValidationError(describeIssues(parsed.error))
  return parsed.data
}
