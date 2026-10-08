import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { AppError } from '../../../shared/errors'
import { MCP_SERVER_NAME, type McpClientConfig } from '../../../shared/mcp'
import type { McpClient } from './client'

type JsonObject = Record<string, unknown>

interface JsonConfigClientOptions {
  readonly id: string
  readonly name: string
  readonly downloadUrl: string
  readonly installDir: () => string
  readonly configPath: () => string
  /** Key of the object that holds the servers by name, e.g. `mcpServers`. */
  readonly serversKey: string
  /** Fields the client expects in every server entry besides command, args and env. */
  readonly extraFields?: JsonObject
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isClientConfig(value: unknown): value is McpClientConfig {
  return (
    isJsonObject(value) &&
    typeof value.command === 'string' &&
    Array.isArray(value.args) &&
    value.args.every((arg) => typeof arg === 'string') &&
    (value.env === undefined || isJsonObject(value.env))
  )
}

/** A client that keeps its servers in a JSON file under one key, like Claude Desktop. */
export function jsonConfigClient({
  id,
  name,
  downloadUrl,
  installDir,
  configPath,
  serversKey,
  extraFields = {}
}: JsonConfigClientOptions): McpClient {
  const read = (): { readonly file: JsonObject; readonly servers: JsonObject } => {
    const path = configPath()
    if (!existsSync(path)) return { file: {}, servers: {} }

    let file: unknown
    try {
      file = JSON.parse(readFileSync(path, 'utf8'))
    } catch (error) {
      throw new AppError('MCP_CLIENT_CONFIG_INVALID', `${path}: ${String(error)}`)
    }
    if (!isJsonObject(file)) throw new AppError('MCP_CLIENT_CONFIG_INVALID', path)

    const servers = file[serversKey] ?? {}
    if (!isJsonObject(servers)) throw new AppError('MCP_CLIENT_CONFIG_INVALID', path)
    return { file, servers }
  }

  // Written to a temporary file first, so a client reading at the same moment never sees a
  // half-written file. Only the entry for Taktra changes; everything else is written back as read.
  const write = (file: JsonObject): void => {
    const path = configPath()
    const temporary = `${path}.taktra-${process.pid}.tmp`
    try {
      writeFileSync(temporary, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
      renameSync(temporary, path)
    } catch (error) {
      throw new AppError('MCP_CLIENT_CONFIG_WRITE_FAILED', `${path}: ${String(error)}`)
    }
  }

  const toEntry = (config: McpClientConfig): JsonObject => ({ ...extraFields, ...config })

  return {
    id,
    name,
    downloadUrl,
    configPath,
    isInstalled: () => existsSync(installDir()),
    readEntry: () => {
      const entry = read().servers[MCP_SERVER_NAME]
      return isClientConfig(entry) ? entry : null
    },
    writeEntry: (config) => {
      const { file, servers } = read()
      write({ ...file, [serversKey]: { ...servers, [MCP_SERVER_NAME]: toEntry(config) } })
    },
    removeEntry: () => {
      const { file, servers } = read()
      if (!(MCP_SERVER_NAME in servers)) return
      const rest = Object.entries(servers).filter(([key]) => key !== MCP_SERVER_NAME)
      write({ ...file, [serversKey]: Object.fromEntries(rest) })
    },
    formatEntry: (config) =>
      JSON.stringify({ [serversKey]: { [MCP_SERVER_NAME]: toEntry(config) } }, null, 2)
  }
}
