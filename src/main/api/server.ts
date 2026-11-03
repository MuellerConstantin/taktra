import type { Server } from 'node:http'
import { createAdaptorServer } from '@hono/node-server'
import type { Hono } from 'hono'

/** Listens on the loopback interface only. */
export function listen(app: Hono, port: number): Promise<Server> {
  const server = createAdaptorServer({ fetch: app.fetch }) as Server
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject)
      resolve(server)
    })
  })
}

/** Closes open event streams as well, which would otherwise keep the server open. */
export function close(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve())
    server.closeAllConnections()
  })
}
