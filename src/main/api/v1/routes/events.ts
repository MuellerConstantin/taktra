import { z, type OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { events, type AppEvent } from '@/main/core'
import { errors } from '@/main/api/v1/errors'

const sentEvents: readonly AppEvent[] = [
  'signal:timer',
  'signal:data',
  'signal:profiles',
  'signal:settings'
]

/** Server-sent events without data: a client reloads what it shows when one arrives. */
function streamEvents(c: Context): Response {
  return streamSSE(c, async (stream) => {
    const unsubscribe = sentEvents.map((event) =>
      events.on(event, () => void stream.writeSSE({ event, data: '' }))
    )
    await new Promise<void>((resolve) => stream.onAbort(resolve))
    unsubscribe.forEach((remove) => remove())
  })
}

/** A stream is no JSON route, so it is described in the registry and routed on its own. */
export function registerEventRoutes(v1: OpenAPIHono): void {
  v1.openAPIRegistry.registerPath({
    method: 'get',
    path: '/events',
    tags: ['Events'],
    summary: 'Follow changes',
    description:
      'Server-sent events without data: signal:data after any change of the profile data, signal:timer when the running timer changes, signal:profiles when another profile becomes active, signal:settings for the app settings. Reload what you show when one arrives.',
    responses: {
      200: {
        description: 'An endless event stream',
        content: { 'text/event-stream': { schema: z.string() } }
      },
      ...errors()
    }
  })
  v1.get('/events', streamEvents)
}
