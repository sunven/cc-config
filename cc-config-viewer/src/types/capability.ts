import type { McpServer } from './mcp'
import type { Agent } from './agent'

/**
 * Unified capability type that represents either an MCP server or an Agent
 * This is the core type for the unified capability panel
 */
export type UnifiedCapability = {
  id: string
  type: 'mcp' | 'agent'
  name: string
  description?: string
  status: 'active' | 'inactive' | 'error'
  source: 'user' | 'project' | 'local'
  sourcePath: string
  lastModified?: Date
  // MCP-specific fields
  mcpData?: McpServer
  // Agent-specific fields
  agentData?: Agent
}

/**
 * Filter state for capabilities
 */
export interface CapabilityFilterState {
  type?: 'all' | 'mcp' | 'agent'
  source?: 'user' | 'project' | 'local'
  status?: 'active' | 'inactive' | 'error'
  searchQuery?: string
}

/**
 * Sort state for capabilities
 */
export interface CapabilitySortState {
  field: 'name' | 'type' | 'status' | 'source'
  direction: 'asc' | 'desc'
}

/**
 * Result of combining MCP servers and Agents
 */
export interface CapabilityUnificationResult {
  capabilities: UnifiedCapability[]
  totalCount: number
  mcpCount: number
  agentCount: number
}