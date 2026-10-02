import { AppError } from '../shared/errors'

const HEX_COLOR = /^#[0-9a-f]{6}$/

export function normalizeColor(color: string | null | undefined): string | null | undefined {
  if (color === undefined) return undefined
  const normalized = color?.trim().toLowerCase() || null
  if (normalized && !HEX_COLOR.test(normalized))
    throw new AppError('VALIDATION_FAILED', `Invalid color: ${normalized}`)
  return normalized
}
