import { z } from 'zod'
import { MAX_NAME_LENGTH } from './limits'

export const emptyToNull = (value: string): string | null => value || null

export const id = z.number().int().positive()

export const name = z.string().trim().min(1).max(MAX_NAME_LENGTH)

export const color = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^(#[0-9a-f]{6})?$/)
  .transform(emptyToNull)
  .nullable()

function isCalendarDate(value: string): boolean {
  return new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)
}

export const localDate = z.iso.date().refine(isCalendarDate, 'Invalid calendar date')

export const filePath = z.string().min(1)

export const listOptions = z.object({ includeArchived: z.boolean().optional() }).optional()
