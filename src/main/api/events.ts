import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { events, type AppEvent } from '../core'

const sentEvents: readonly AppEvent[] = ['timer', 'data', 'profiles', 'settings']

/** Server-sent events without data: a client reloads what it shows when one arrives. */
export function streamEvents(c: Context): Response {
  return streamSSE(c, async (stream) => {
    const unsubscribe = sentEvents.map((event) =>
      events.onChanged(event, () => void stream.writeSSE({ event, data: '' }))
    )
    await new Promise<void>((resolve) => stream.onAbort(resolve))
    unsubscribe.forEach((remove) => remove())
  })
}
