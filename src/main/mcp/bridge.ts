/**
 * Entry point MCP clients start with `ELECTRON_RUN_AS_NODE=1 <executable> out/main/mcp.js`. It
 * connects their stdio to the running app, which owns the profile, and starts the app if needed.
 * Electron in app mode cannot serve stdio on Windows, and this file runs as plain Node, so it
 * must not import electron.
 *
 * Clients do not restart a server whose process ended, so the bridge outlives the app: when the
 * app quits, it answers open requests with an error and connects again on the next one. A new
 * app instance knows nothing of the session, so the bridge replays the client's handshake to it.
 */

import { spawn } from 'node:child_process'
import { connect, type Socket } from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { START_HIDDEN_ARG } from '../constants'
import { mcpPipePath } from './pipe'

const RETRY_MS = 100
const START_TIMEOUT_MS = 15_000
const REPLAYED_INITIALIZE_ID = 'taktra-bridge-initialize'

type RequestId = string | number

interface Message {
  readonly id?: RequestId | null
  readonly method?: string
}

let socket: Socket | null = null
let connecting: Promise<Socket> | null = null
let hasConnected = false
let initializeLine: string | null = null
let initializedLine: string | null = null
const pendingRequests = new Set<RequestId>()

function parseMessage(line: string): Message | null {
  try {
    const value: unknown = JSON.parse(line)
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Message)
      : null
  } catch {
    return null
  }
}

function onLines(stream: NodeJS.ReadableStream, listener: (line: string) => void): void {
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk: string) => {
    buffer += chunk
    let end: number
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end).replace(/\r$/, '')
      buffer = buffer.slice(end + 1)
      if (line.trim()) listener(line)
    }
  })
}

function sendToClient(line: string): void {
  process.stdout.write(`${line}\n`)
}

function sendError(id: RequestId, message: string): void {
  sendToClient(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32000, message } }))
}

function startApp(): void {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const isPackaged = __dirname.includes('app.asar')
  const args = isPackaged ? [START_HIDDEN_ARG] : [resolve(__dirname, '../..'), START_HIDDEN_ARG]
  spawn(process.execPath, args, { detached: true, stdio: 'ignore', env }).unref()
}

function connectOnce(): Promise<Socket> {
  return new Promise((resolveSocket, reject) => {
    const candidate = connect(mcpPipePath())
    candidate.once('connect', () => resolveSocket(candidate))
    candidate.once('error', reject)
  })
}

async function connectToApp(): Promise<Socket> {
  try {
    return await connectOnce()
  } catch {
    startApp()
  }
  const deadline = Date.now() + START_TIMEOUT_MS
  while (Date.now() < deadline) {
    await delay(RETRY_MS)
    try {
      return await connectOnce()
    } catch {
      // The app is still starting, or access for assistants is turned off.
    }
  }
  throw new Error('Taktra is not reachable')
}

function attach(appSocket: Socket): void {
  socket = appSocket
  onLines(appSocket, (line) => {
    const message = parseMessage(line)
    if (message?.id === REPLAYED_INITIALIZE_ID) return
    if (message?.method === undefined && message?.id != null) pendingRequests.delete(message.id)
    sendToClient(line)
  })
  appSocket.on('error', () => {})
  appSocket.on('close', () => {
    socket = null
    for (const id of pendingRequests) sendError(id, 'Taktra was closed. Try again.')
    pendingRequests.clear()
  })

  if (hasConnected && initializeLine) {
    const initialize = JSON.parse(initializeLine) as object
    appSocket.write(`${JSON.stringify({ ...initialize, id: REPLAYED_INITIALIZE_ID })}\n`)
    if (initializedLine) appSocket.write(`${initializedLine}\n`)
  }
  hasConnected = true
}

function ensureConnected(): Promise<Socket> {
  if (socket) return Promise.resolve(socket)
  connecting ??= connectToApp()
    .then((appSocket) => {
      attach(appSocket)
      return appSocket
    })
    .finally(() => {
      connecting = null
    })
  return connecting
}

async function forwardToApp(line: string): Promise<void> {
  const message = parseMessage(line)
  if (message?.method === 'initialize') initializeLine = line
  if (message?.method === 'notifications/initialized') initializedLine = line
  const requestId = message?.method !== undefined && message.id != null ? message.id : null

  try {
    const appSocket = await ensureConnected()
    if (requestId !== null) pendingRequests.add(requestId)
    appSocket.write(`${line}\n`)
  } catch {
    if (requestId !== null)
      sendError(
        requestId,
        'Taktra is not reachable. Turn on access for AI assistants in the settings of Taktra.'
      )
  }
}

// Messages are forwarded one after another, so none overtakes another while the app starts.
let forwarding = Promise.resolve()
onLines(process.stdin, (line) => {
  forwarding = forwarding.then(() => forwardToApp(line))
})
process.stdin.on('end', () => {
  socket?.end()
  process.exit(0)
})
