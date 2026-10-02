import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { AppError, type IpcResponse } from '../shared/errors'

export function handle<Args extends unknown[], Result>(
  channel: string,
  fn: (event: IpcMainInvokeEvent, ...args: Args) => Result | Promise<Result>
): void {
  ipcMain.handle(channel, async (event, ...args): Promise<IpcResponse<Awaited<Result>>> => {
    try {
      return { ok: true, value: await fn(event, ...(args as Args)) }
    } catch (error) {
      if (error instanceof AppError) return { ok: false, error: { code: error.code } }

      console.error(`IPC handler "${channel}" failed`, error)
      return { ok: false, error: { code: 'UNKNOWN' } }
    }
  })
}
