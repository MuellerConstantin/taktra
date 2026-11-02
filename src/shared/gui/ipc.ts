import type { ErrorCode } from '../model/errors'

export type IpcResponse<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: ErrorCode } }
