import { AppError, type IpcResponse } from '../../../shared/errors'

type Unwrapped<T> = {
  readonly [K in keyof T]: T[K] extends (...args: infer Args) => Promise<IpcResponse<infer Result>>
    ? (...args: Args) => Promise<Result>
    : Unwrapped<T[K]>
}

function unwrap<T extends object>(source: T): Unwrapped<T> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      typeof value === 'function'
        ? async (...args: unknown[]) => {
            const response = (await value(...args)) as IpcResponse<unknown>
            if (response.ok) return response.value
            throw new AppError(response.error.code)
          }
        : unwrap(value)
    ])
  ) as Unwrapped<T>
}

const { events: ipcEvents, ...invokers } = window.api

export const api = unwrap(invokers)

export const events = ipcEvents
