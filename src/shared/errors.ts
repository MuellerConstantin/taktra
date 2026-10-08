export const errorCodes = [
  'NO_ACTIVE_PROFILE',
  'PROFILE_NOT_FOUND',
  'PROFILE_UNAVAILABLE',
  'PROFILE_FILE_EXISTS',
  'PROFILE_INVALID',
  'PROFILE_NEWER_VERSION',
  'PROFILE_MIGRATION_FAILED',
  'PROJECT_NOT_FOUND',
  'PROJECT_NAME_TAKEN',
  'PROJECT_HAS_TIME_ENTRIES',
  'ACTIVITY_NOT_FOUND',
  'ACTIVITY_NAME_TAKEN',
  'ACTIVITY_HAS_TIME_ENTRIES',
  'TIME_ENTRY_NOT_FOUND',
  'TAG_NOT_FOUND',
  'TAG_NAME_TAKEN',
  'CLIENT_NOT_FOUND',
  'CLIENT_NAME_TAKEN',
  'CLIENT_HAS_TIME_ENTRIES',
  'CLIENT_SET_BY_PROJECT',
  'SHORTCUT_UNAVAILABLE',
  'EXPORT_WRITE_FAILED',
  'ASSISTANT_CONFIG_INVALID',
  'ASSISTANT_CONFIG_WRITE_FAILED',
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
