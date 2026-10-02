export const errorCodes = [
  'NO_ACTIVE_PROFILE',
  'PROFILE_NOT_FOUND',
  'PROFILE_UNAVAILABLE',
  'PROFILE_FILE_EXISTS',
  'PROFILE_INVALID',
  'PROFILE_NEWER_VERSION',
  'PROJECT_NOT_FOUND',
  'PROJECT_NAME_TAKEN',
  'VALIDATION_FAILED',
  'UNKNOWN'
] as const

export type ErrorCode = (typeof errorCodes)[number]

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string
  ) {
    super(message ?? code)
    this.name = 'AppError'
  }
}

export function isAppError(error: unknown, ...codes: readonly ErrorCode[]): error is AppError {
  return error instanceof AppError && (codes.length === 0 || codes.includes(error.code))
}

export type IpcResponse<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: ErrorCode } }
