import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import type { InvokeChannel, IpcContract, IpcResponse } from '../../../shared/gui/ipc'
import { AppError } from '../../../shared/model/errors'

type Result<Channel extends InvokeChannel> = Awaited<ReturnType<IpcContract[Channel]>>

/** IPC copies every argument, so a `readonly` in the contract does not matter to the handler. */
type Writable<T> = T extends Date
  ? T
  : T extends object
    ? { -readonly [Key in keyof T]: Writable<T[Key]> }
    : T

/** `never` unless the schema accepts every argument list the contract allows for the channel. */
type AcceptsContract<Args extends z.ZodTuple, Channel extends InvokeChannel> =
  Writable<Parameters<IpcContract[Channel]>> extends z.input<Args> ? unknown : never

export function handle<Channel extends InvokeChannel, Args extends z.ZodTuple>(
  channel: Channel,
  args: Args & AcceptsContract<Args, Channel>,
  fn: (
    event: IpcMainInvokeEvent,
    ...args: z.output<Args>
  ) => Result<Channel> | Promise<Result<Channel>>
): void {
  ipcMain.handle(channel, async (event, ...raw): Promise<IpcResponse<Result<Channel>>> => {
    const parsed = args.safeParse(raw)
    if (!parsed.success) {
      console.warn(`IPC handler "${channel}" rejected its arguments`, z.prettifyError(parsed.error))
      return { ok: false, error: { code: 'VALIDATION_FAILED' } }
    }

    try {
      return { ok: true, value: await fn(event, ...parsed.data) }
    } catch (error) {
      if (error instanceof AppError) return { ok: false, error: { code: error.code } }

      console.error(`IPC handler "${channel}" failed`, error)
      return { ok: false, error: { code: 'UNKNOWN' } }
    }
  })
}
