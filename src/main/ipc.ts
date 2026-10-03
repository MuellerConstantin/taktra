import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import { AppError, type IpcResponse } from '../shared/errors'

export function handle<Args extends z.ZodTuple, Result>(
  channel: string,
  args: Args,
  fn: (event: IpcMainInvokeEvent, ...args: z.output<Args>) => Result | Promise<Result>
): void {
  ipcMain.handle(channel, async (event, ...raw): Promise<IpcResponse<Awaited<Result>>> => {
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
