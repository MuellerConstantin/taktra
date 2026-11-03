import type { Server } from 'node:http'
import { apiAccess, events, settings } from '../core'
import { createApp } from './app'
import { close, listen } from './server'

const app = createApp(() => settings.get().apiPort)

let server: Server | null = null
let listeningOn: number | null = null
let pending: Promise<void> = Promise.resolve()

async function apply(): Promise<void> {
  const { apiEnabled, apiPort } = settings.get()
  const wanted = apiEnabled ? apiPort : null
  if (wanted === listeningOn && (wanted === null || server)) return

  if (server) await close(server)
  server = null
  listeningOn = wanted
  if (wanted === null) {
    apiAccess.setStatus('disabled')
    return
  }

  try {
    server = await listen(app, wanted)
    apiAccess.setStatus('running')
  } catch (error) {
    console.error(`API could not listen on port ${wanted}`, error)
    apiAccess.setStatus('portInUse')
  }
}

/** Changes are applied one after another, so a quick toggle never leaves two servers. */
function schedule(): Promise<void> {
  pending = pending.then(apply)
  return pending
}

export function startApi(): void {
  events.onChanged('settings', () => void schedule())
  void schedule()
}

export async function stopApi(): Promise<void> {
  await pending
  if (server) await close(server)
  server = null
}
