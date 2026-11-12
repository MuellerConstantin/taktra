import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { ErrorCode } from '@/shared/model/errors'

/** Codes of the HTTP layer itself, in addition to the error codes of the core. */
export type HttpErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN_ORIGIN'
  | 'INVALID_HOST'
  | 'ROUTE_NOT_FOUND'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'INVALID_JSON'

const httpStatus: Record<HttpErrorCode, ContentfulStatusCode> = {
  UNAUTHORIZED: 401,
  FORBIDDEN_ORIGIN: 403,
  INVALID_HOST: 400,
  ROUTE_NOT_FOUND: 404,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  INVALID_JSON: 400
}

export class HttpError extends Error {
  constructor(readonly code: HttpErrorCode) {
    super(code)
    this.name = 'HttpError'
  }

  get status(): ContentfulStatusCode {
    return httpStatus[this.code]
  }
}

/** Every other error of the core describes a conflict with the current state. */
export function statusOf(code: ErrorCode): ContentfulStatusCode {
  if (code === 'VALIDATION_FAILED') return 400
  if (code.endsWith('_NOT_FOUND')) return 404
  if (code === 'UNKNOWN') return 500
  return 409
}
