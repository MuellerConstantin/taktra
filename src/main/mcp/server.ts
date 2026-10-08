import { rmSync } from 'node:fs'
import { createServer, type Server as PipeServer, type Socket } from 'node:net'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { handle } from '../ipc'
import { getSettings, onSettingsChanged } from '../settings'
import { initMcpClients } from './clients'
import { bridgeLaunchConfig } from './launch'
import { mcpPipePath } from './pipe'
import { createMcpServer } from './tools'

let pipeServer: PipeServer | null = null
const connections = new Set<Socket>()

function startServing(): void {
  if (pipeServer) return
  const path = mcpPipePath()
  // A socket file left behind by a crash blocks listening; the single instance lock means no
  // other Taktra uses it. Named pipes on Windows vanish with their process.
  if (process.platform !== 'win32') rmSync(path, { force: true })

  pipeServer = createServer((socket) => {
    connections.add(socket)
    socket.on('close', () => connections.delete(socket))
    createMcpServer()
      .connect(new StdioServerTransport(socket, socket))
      .catch((error) => console.error('MCP connection failed', error))
  })
  pipeServer.on('error', (error) => console.error('MCP pipe failed', error))
  pipeServer.listen(path)
}

function stopServing(): void {
  pipeServer?.close()
  pipeServer = null
  for (const socket of connections) socket.destroy()
}

function applyMcpAccess(): void {
  if (getSettings().mcpAccess) startServing()
  else stopServing()
}

export function initMcp(): void {
  applyMcpAccess()
  onSettingsChanged(applyMcpAccess)
  handle('mcp:config', z.tuple([]), () => bridgeLaunchConfig())
  initMcpClients()
}
