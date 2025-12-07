import { readConfig, parseConfig } from './tauriApi'
import type { ConfigEntry } from '../types'

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
  source: 'user' | 'project' | 'local'
): ConfigEntry[] {
  return Object.entries(config).map(([key, value]) => ({
    key,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}

export function extractMcpServers(config: Record<string, any>, source: 'user' | 'project' | 'local'): ConfigEntry[] {
  const mcpServers = config.mcpServers || config.mcp_servers || {}
  return Object.entries(mcpServers).map(([key, value]) => ({
    key: `mcpServers.${key}`,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}

export function extractSubAgents(config: Record<string, any>, source: 'user' | 'project' | 'local'): ConfigEntry[] {
  const subAgents = config.subAgents || config.sub_agents || config.agents || {}
  return Object.entries(subAgents).map(([key, value]) => ({
    key: `subAgents.${key}`,
    value,
    source: { type: source, path: '', priority: source === 'user' ? 1 : source === 'project' ? 2 : 3 },
  }))
}

export function extractAllEntries(config: Record<string, any>, source: 'user' | 'project' | 'local'): ConfigEntry[] {
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
