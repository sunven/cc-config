import { readConfig, parseConfig } from './tauriApi'
import type { ConfigEntry } from '../types'
import type { McpServer } from '../types/mcp'

export async function readAndParseConfig(path: string): Promise<Record<string, any>> {
  const content = await readConfig(path)
  const parsed = await parseConfig(content)
  return parsed
}

export function parseConfigFile(content: string): Record<string, any> {
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Invalid JSON: ${error}`)
  }
}

export function stringifyConfig(config: Record<string, any>): string {
  return JSON.stringify(config, null, 2)
}

export function extractConfigEntries(
  config: Record<string, any>,
  source: 'user' | 'project' | 'inherited'
): ConfigEntry[] {
  return Object.entries(config).map(([key, value]) => ({
    key,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}

export function extractMcpServers(config: Record<string, any>, source: 'user' | 'project' | 'inherited'): ConfigEntry[] {
  const mcpServers = config.mcpServers || config.mcp_servers || {}
  return Object.entries(mcpServers).map(([key, value]) => ({
    key: `mcpServers.${key}`,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}

export function extractSubAgents(config: Record<string, any>, source: 'user' | 'project' | 'inherited'): ConfigEntry[] {
  const subAgents = config.subAgents || config.sub_agents || config.agents || {}
  return Object.entries(subAgents).map(([key, value]) => ({
    key: `subAgents.${key}`,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}

export function extractAllEntries(config: Record<string, any>, source: 'user' | 'project' | 'inherited'): ConfigEntry[] {
  const entries: ConfigEntry[] = []

  // Create a copy of config without mcpServers and subAgents to avoid double extraction
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mcpServers: _mcpServers, mcp_servers: _mcp_servers, subAgents: _subAgents, sub_agents: _sub_agents, agents: _agents, ...restConfig } = config

  // Add direct config entries (excluding nested objects that will be processed separately)
  entries.push(...extractConfigEntries(restConfig, source))

  // Add MCP servers with correct source type
  entries.push(...extractMcpServers(config, source))

  // Add Sub Agents with correct source type
  entries.push(...extractSubAgents(config, source))

  return entries
}

/**
 * Parse MCP servers from configuration files
 * Supports both ~/.claude.json and .mcp.json formats
 */
export function parseMcpServers(
  userConfig?: Record<string, any>,
  projectConfig?: Record<string, any>
): {
  userMcpServers: McpServer[]
  projectMcpServers: McpServer[]
  inheritedMcpServers: McpServer[]
} {
  const userMcpServers: McpServer[] = []
  const projectMcpServers: McpServer[] = []
  const inheritedMcpServers: McpServer[] = []

  // Parse user-level MCPs from ~/.claude.json
  if (userConfig?.mcpServers) {
    for (const [name, config] of Object.entries(userConfig.mcpServers)) {
      const server = normalizeMcpServer(name, config as Record<string, any>, '/home/user/.claude.json')
      if (server) {
        userMcpServers.push(server)
      }
    }
  }

  // Parse project-level MCPs from .mcp.json
  if (projectConfig?.servers) {
    for (const [name, config] of Object.entries(projectConfig.servers)) {
      const server = normalizeMcpServer(name, config as Record<string, any>, './.mcp.json')
      if (server) {
        projectMcpServers.push(server)
      }
    }
  }

  // Check for MCPs in project-level .claude.json
  if (projectConfig?.mcpServers) {
    for (const [name, config] of Object.entries(projectConfig.mcpServers)) {
      const server = normalizeMcpServer(name, config as Record<string, any>, './.claude.json')
      if (server) {
        // Check if this overrides a user-level MCP
        const userServer = userMcpServers.find(s => s.name === name)
        if (userServer) {
          // This is an override, mark as inherited
          inheritedMcpServers.push(userServer)
        }
        projectMcpServers.push(server)
      }
    }
  }

  // Deduplicate servers by name, preferring project-level over user-level
  const allServers = [...projectMcpServers, ...userMcpServers]
  const serverMap = new Map<string, McpServer>()

  for (const server of allServers) {
    const existing = serverMap.get(server.name)
    if (!existing) {
      serverMap.set(server.name, server)
    } else {
      // Project-level overrides user-level
      if (server.sourcePath.startsWith('./')) {
        serverMap.set(server.name, server)
      }
    }
  }

  // Separate back into user and project
  const finalUserMcpServers: McpServer[] = []
  const finalProjectMcpServers: McpServer[] = []

  for (const server of serverMap.values()) {
    if (server.sourcePath.startsWith('./')) {
      finalProjectMcpServers.push(server)
    } else {
      finalUserMcpServers.push(server)
    }
  }

  return {
    userMcpServers: finalUserMcpServers,
    projectMcpServers: finalProjectMcpServers,
    inheritedMcpServers
  }
}

/**
 * Check MCP server status based on type
 */
async function checkMcpServerStatus(
  type: 'http' | 'stdio' | 'sse',
  config: Record<string, any>
): Promise<'active' | 'inactive' | 'error'> {
  try {
    switch (type) {
      case 'http': {
        // For HTTP servers, check if URL is accessible
        const url = config.url || config.endpoint || 'http://localhost:3000/health'
        try {
          const response = await fetch(url, { method: 'GET' })
          return response.ok ? 'active' : 'inactive'
        } catch {
          return 'error'
        }
      }
      case 'stdio': {
        // For stdio servers, check if command exists and is executable
        const command = config.command
        if (!command) return 'inactive'

        // In a real implementation, we'd check if the process is running
        // For now, if command exists, assume it could be active
        // TODO: Implement actual process check via Tauri API
        return 'inactive'
      }
      case 'sse': {
        // For SSE servers, check if URL is accessible
        const url = config.url
        if (!url) return 'inactive'

        try {
          const response = await fetch(url, { method: 'GET' })
          return response.ok ? 'active' : 'inactive'
        } catch {
          return 'error'
        }
      }
      default:
        return 'inactive'
    }
  } catch (error) {
    console.error(`Failed to check status for ${type} server:`, error)
    return 'error'
  }
}

/**
 * Normalize MCP server configuration to McpServer interface
 */
function normalizeMcpServer(
  name: string,
  config: Record<string, any>,
  sourcePath: string
): McpServer | null {
  try {
    // Determine server type from configuration
    let type: 'http' | 'stdio' | 'sse' = 'stdio'

    if (config.type) {
      type = config.type as 'http' | 'stdio' | 'sse'
    } else if (config.url || config.headers) {
      type = 'http'
    } else if (config.command || config.args) {
      type = 'stdio'
    }

    // Detect status based on server type and configuration
    // Note: Status checking is asynchronous, so we use a placeholder for now
    // In production, this would be updated via updateMcpServers with async status checks
    const status: 'active' | 'inactive' | 'error' = 'inactive'

    return {
      name,
      type,
      description: config.description || `${name} MCP server`,
      config,
      status,
      sourcePath
    }
  } catch (error) {
    console.error(`Failed to parse MCP server ${name}:`, error)
    return null
  }
}

/**
 * Merge user and project configurations
 * Project config overrides user config for the same keys
 * Marks inherited vs project-specific items
 */
export function mergeConfigs(
  userConfig: Record<string, any>,
  projectConfig: Record<string, any>
): ConfigEntry[] {
  const merged: ConfigEntry[] = []

  // Extract all user entries
  const userEntries = extractAllEntries(userConfig, 'user')

  // Extract all project entries
  const projectEntries = extractAllEntries(projectConfig, 'project')

  // Create a map for O(1) lookup
  const projectKeys = new Set(projectEntries.map(e => e.key))

  // Add user entries that are not overridden by project
  userEntries.forEach(entry => {
    if (!projectKeys.has(entry.key)) {
      merged.push({
        ...entry,
        inherited: true, // Mark as inherited from user level
      })
    }
  })

  // Add project entries (overrides user config)
  projectEntries.forEach(entry => {
    const userEntry = userEntries.find(e => e.key === entry.key)
    merged.push({
      ...entry,
      overridden: !!userEntry, // Mark if it overrides user config
    })
  })

  return merged
}

