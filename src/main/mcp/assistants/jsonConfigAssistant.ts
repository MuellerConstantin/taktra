import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { AppError } from '../../../shared/errors'
import { MCP_SERVER_NAME, type McpLaunchConfig } from '../../../shared/mcp'
import type { Assistant } from './assistant'

type JsonObject = Record<string, unknown>

interface JsonConfigAssistantOptions {
  readonly id: string
  readonly name: string
  readonly downloadUrl: string
  readonly installDir: () => string
  readonly configPath: () => string
  /** Key of the object that holds the servers by name, e.g. `mcpServers`. */
  readonly serversKey: string
  /** Fields the assistant expects in every server entry besides command, args and env. */
  readonly extraFields?: JsonObject
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLaunchConfig(value: unknown): value is McpLaunchConfig {
  return (
    isJsonObject(value) &&
    typeof value.command === 'string' &&
    Array.isArray(value.args) &&
    value.args.every((arg) => typeof arg === 'string') &&
    (value.env === undefined || isJsonObject(value.env))
  )
}

/** An assistant that keeps its servers in a JSON file under one key, like Claude Desktop. */
export function jsonConfigAssistant({
  id,
  name,
  downloadUrl,
  installDir,
  configPath,
  serversKey,
  extraFields = {}
}: JsonConfigAssistantOptions): Assistant {
  const read = (): { readonly file: JsonObject; readonly servers: JsonObject } => {
    const path = configPath()
    if (!existsSync(path)) return { file: {}, servers: {} }

    let file: unknown
    try {
      file = JSON.parse(readFileSync(path, 'utf8'))
    } catch (error) {
      throw new AppError('ASSISTANT_CONFIG_INVALID', `${path}: ${String(error)}`)
    }
    if (!isJsonObject(file)) throw new AppError('ASSISTANT_CONFIG_INVALID', path)

    const servers = file[serversKey] ?? {}
    if (!isJsonObject(servers)) throw new AppError('ASSISTANT_CONFIG_INVALID', path)
    return { file, servers }
  }

  // Written to a temporary file first, so an assistant reading at the same moment never sees a
  // half-written file. Only the entry for Taktra changes; everything else is written back as read.
  const write = (file: JsonObject): void => {
    const path = configPath()
    const temporary = `${path}.taktra-${process.pid}.tmp`
    try {
      writeFileSync(temporary, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
      renameSync(temporary, path)
    } catch (error) {
      throw new AppError('ASSISTANT_CONFIG_WRITE_FAILED', `${path}: ${String(error)}`)
    }
  }

  const toEntry = (config: McpLaunchConfig): JsonObject => ({ ...extraFields, ...config })

  return {
    id,
    name,
    downloadUrl,
    configPath,
    isInstalled: () => existsSync(installDir()),
    readEntry: () => {
      const entry = read().servers[MCP_SERVER_NAME]
      return isLaunchConfig(entry) ? entry : null
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
