/**
 * Entry point MCP clients start with `ELECTRON_RUN_AS_NODE=1 <executable> out/main/mcp.js`. It
 * connects their stdio to the running app, which owns the profile, and starts the app if needed.
 * Electron in app mode cannot serve stdio on Windows, and this file runs as plain Node, so it
 * must not import electron.
 */
import { spawn } from 'node:child_process'
import { connect } from 'node:net'
import { resolve } from 'node:path'
import { START_HIDDEN_ARG } from './constants'
import { mcpPipePath } from './mcpPipe'

const RETRY_MS = 100
const START_TIMEOUT_MS = 15_000

function startApp(): void {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const isPackaged = __dirname.includes('app.asar')
  const args = isPackaged ? [START_HIDDEN_ARG] : [resolve(__dirname, '../..'), START_HIDDEN_ARG]
  spawn(process.execPath, args, { detached: true, stdio: 'ignore', env }).unref()
}

function connectToApp(deadline: number | null): void {
  const socket = connect(mcpPipePath())

  socket.once('connect', () => {
    process.stdin.pipe(socket)
    socket.pipe(process.stdout)
    process.stdin.on('end', () => socket.end())
    socket.on('close', () => process.exit(0))
  })

  socket.once('error', () => {
    if (deadline === null) {
      startApp()
      connectToApp(Date.now() + START_TIMEOUT_MS)
      return
    }
    if (Date.now() > deadline) {
      process.stderr.write(
        'Taktra is not reachable. Turn on access for AI assistants in the settings of Taktra.\n'
      )
      process.exit(1)
    }
    setTimeout(() => connectToApp(deadline), RETRY_MS)
  })
}

connectToApp(null)
