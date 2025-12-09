import type { McpServer } from '../types/mcp'
import type { Agent } from '../types/agent'
import type { UnifiedCapability, CapabilityUnificationResult } from '../types/capability'

/**
 * Utility function to determine the source of a capability based on its sourcePath
 */
export function getSourceFromPath(sourcePath: string): 'user' | 'project' | 'local' {
  // User-level: ~/.claude.json or ~/.claude/agents/ (absolute path, not starting with ./)
  if ((sourcePath.includes('.claude.json') || sourcePath.includes('.claude/agents/')) && !sourcePath.startsWith('./')) {
    return 'user'
  }
  // Project-level: ./.mcp.json or ./.claude.json or ./.claude/agents/ (relative path starting with ./)
  if (sourcePath.startsWith('./')) {
    return 'project'
  }
  // Local/inherited (any other path)
  return 'local'
}

/**
 * Generate a unique ID for a capability based on its type and data
 */
export function generateCapabilityId(
  type: 'mcp' | 'agent',
  data: McpServer | Agent,
  sourcePath: string
): string {
  if (type === 'mcp') {
    const server = data as McpServer
    return `mcp-${server.name}-${sourcePath}`
  } else {
    const agent = data as Agent
    return `agent-${agent.id}-${agent.sourcePath}`
  }
}

/**
 * Convert an MCP server to a unified capability
 */
export function mcpToUnifiedCapability(server: McpServer): UnifiedCapability {
  const source = getSourceFromPath(server.sourcePath)

  return {
    id: generateCapabilityId('mcp', server, server.sourcePath),
    type: 'mcp',
    name: server.name,
    description: server.description,
    status: server.status,
    source,
    sourcePath: server.sourcePath,
    mcpData: server
  }
}

/**
 * Convert an agent to a unified capability
 */
export function agentToUnifiedCapability(agent: Agent): UnifiedCapability {
  const source = getSourceFromPath(agent.sourcePath)

  return {
    id: generateCapabilityId('agent', agent, agent.sourcePath),
    type: 'agent',
    name: agent.name,
    description: agent.description,
    status: agent.status,
    source,
    sourcePath: agent.sourcePath,
    lastModified: agent.lastModified,
    agentData: agent
  }
}

/**
 * Merge MCP servers and Agents into a unified list of capabilities
 */
export function unifyCapabilities(
  mcpServers: McpServer[],
  agents: Agent[]
): CapabilityUnificationResult {
  // Convert MCP servers to unified capabilities
  const mcpCapabilities: UnifiedCapability[] = mcpServers.map(mcpToUnifiedCapability)

  // Convert Agents to unified capabilities
  const agentCapabilities: UnifiedCapability[] = agents.map(agentToUnifiedCapability)

  // Combine and sort by name
  const capabilities = [...mcpCapabilities, ...agentCapabilities].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return {
    capabilities,
    totalCount: capabilities.length,
    mcpCount: mcpCapabilities.length,
    agentCount: agentCapabilities.length
  }
}

/**
 * Filter capabilities by type, source, status, and search query
 */
export function filterCapabilities(
  capabilities: UnifiedCapability[],
  filters: {
    type?: 'all' | 'mcp' | 'agent'
    source?: 'user' | 'project' | 'local'
    status?: 'active' | 'inactive' | 'error'
    searchQuery?: string
  }
): UnifiedCapability[] {
  let filtered = [...capabilities]

  // Filter by type
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(cap => cap.type === filters.type)
  }

  // Filter by source
  if (filters.source) {
    filtered = filtered.filter(cap => cap.source === filters.source)
  }

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter(cap => cap.status === filters.status)
  }

  // Filter by search query
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(cap => {
      // Search in name
      if (cap.name.toLowerCase().includes(query)) {
        return true
      }

      // Search in description
      if (cap.description?.toLowerCase().includes(query)) {
        return true
      }

      // Search in type-specific data
      if (cap.type === 'mcp' && cap.mcpData) {
        // Search in MCP type
        if (cap.mcpData.type.toLowerCase().includes(query)) {
          return true
        }
        // Search in MCP config
        const configStr = JSON.stringify(cap.mcpData.config).toLowerCase()
        if (configStr.includes(query)) {
          return true
        }
      } else if (cap.type === 'agent' && cap.agentData) {
        // Search in agent model name
        if (cap.agentData.model.name.toLowerCase().includes(query)) {
          return true
        }
        // Search in agent permissions
        if (cap.agentData.permissions.type.toLowerCase().includes(query)) {
          return true
        }
        // Search in agent scopes
        if (cap.agentData.permissions.scopes.some(scope => scope.toLowerCase().includes(query))) {
          return true
        }
      }

      return false
    })
  }

  return filtered
}

/**
 * Sort capabilities by field and direction
 */
export function sortCapabilities(
  capabilities: UnifiedCapability[],
  sort: {
    field: 'name' | 'type' | 'status' | 'source'
    direction: 'asc' | 'desc'
  }
): UnifiedCapability[] {
  return [...capabilities].sort((a, b) => {
    let aValue: string
    let bValue: string

    switch (sort.field) {
      case 'name':
        aValue = a.name
        bValue = b.name
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'source':
        aValue = a.source
        bValue = b.source
        break
      default:
        return 0
    }

    const comparison = aValue.localeCompare(bValue)
    return sort.direction === 'asc' ? comparison : -comparison
  })
}