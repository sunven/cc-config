export interface McpServer {
  name: string
  type: 'http' | 'stdio' | 'sse'
  description?: string
  config: Record<string, any>
  status: 'active' | 'inactive' | 'error'
  sourcePath: string
}

export interface SubAgent {
  name: string
  description: string
  capabilities: string[]
  status: 'active' | 'inactive'
}

export interface Capability {
  name: string
  type: 'mcp' | 'sub-agent'
  provider: string
  description: string
}
