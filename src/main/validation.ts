import { AppError } from '../shared/errors'

export function assertMaxLength(
  value: string | null | undefined,
  max: number,
  field: string
): void {
  if (value && value.length > max)
    throw new AppError('VALIDATION_FAILED', `${field} must not exceed ${max} characters`)
}
