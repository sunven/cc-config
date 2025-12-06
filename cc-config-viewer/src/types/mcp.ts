export interface McpServer {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  status: 'running' | 'stopped' | 'error'
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
