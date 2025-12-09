import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CapabilityRow } from './CapabilityRow'
import type { UnifiedCapability } from '../types/capability'

// Mock MCP server for testing
const createMockMcpCapability = (): UnifiedCapability => ({
  id: 'mcp-test-1',
  type: 'mcp',
  name: 'Test MCP Server',
  description: 'A test MCP server for testing',
  status: 'active',
  source: 'user',
  sourcePath: '/home/user/.claude.json',
  mcpData: {
    name: 'Test MCP Server',
    type: 'stdio',
    description: 'A test MCP server for testing',
    config: {
      command: 'test-mcp',
      args: ['--verbose']
    },
    status: 'active',
    sourcePath: '/home/user/.claude.json'
  }
})

// Mock Agent for testing
const createMockAgentCapability = (): UnifiedCapability => ({
  id: 'agent-test-1',
  type: 'agent',
  name: 'Test Agent',
  description: 'A test agent for automated tasks',
  status: 'active',
  source: 'project',
  sourcePath: './.claude/agents/test-agent.md',
  lastModified: new Date('2024-01-01'),
  agentData: {
    id: 'agent-test-1',
    name: 'Test Agent',
    description: 'A test agent for automated tasks',
    model: {
      name: 'claude-3-sonnet',
      provider: 'anthropic',
      config: {
        temperature: 0.7,
        maxTokens: 4000
      }
    },
    permissions: {
      type: 'write',
      scopes: ['files', 'tests'],
      restrictions: ['no-delete']
    },
    status: 'active',
    sourcePath: './.claude/agents/test-agent.md',
    lastModified: new Date('2024-01-01')
  }
})

describe('CapabilityRow', () => {
  describe('MCP Server Rendering', () => {
    it('should render MCP server name', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument()
    })

    it('should render MCP server description', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('A test MCP server for testing')).toBeInTheDocument()
    })

    it('should display correct source badge', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByLabelText('Source: user')).toBeInTheDocument()
    })

    it('should display correct type badge with icon', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      const typeBadge = screen.getByLabelText('Type: mcp')
      expect(typeBadge).toBeInTheDocument()
      expect(typeBadge).toContainHTML('🔌')
    })

    it('should display correct status indicator', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByLabelText('Status: active')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('should show configuration preview', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText(/Type: stdio/)).toBeInTheDocument()
      expect(screen.getByText(/command: test-mcp/)).toBeInTheDocument()
    })

    it('should show "View full configuration" button when config exists', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('View full configuration')).toBeInTheDocument()
    })

    it('should not show description if not provided', () => {
      const capability = createMockMcpCapability()
      capability.description = undefined
      render(<CapabilityRow capability={capability} />)
      expect(screen.queryByText('A test MCP server for testing')).not.toBeInTheDocument()
    })

    it('should handle inactive status correctly', () => {
      const capability = createMockMcpCapability()
      capability.status = 'inactive'
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByLabelText('Status: inactive')).toBeInTheDocument()
      expect(screen.getByText('inactive')).toBeInTheDocument()
    })

    it('should handle error status correctly', () => {
      const capability = createMockMcpCapability()
      capability.status = 'error'
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByLabelText('Status: error')).toBeInTheDocument()
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  describe('Agent Rendering', () => {
    it('should render agent name', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
    })

    it('should render agent description', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('A test agent for automated tasks')).toBeInTheDocument()
    })

    it('should display correct source badge', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByLabelText('Source: project')).toBeInTheDocument()
    })

    it('should display correct type badge with icon', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      const typeBadge = screen.getByLabelText('Type: agent')
      expect(typeBadge).toBeInTheDocument()
      expect(typeBadge).toContainHTML('🤖')
    })

    it('should display model information', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText(/Model: claude-3-sonnet/)).toBeInTheDocument()
    })

    it('should display permissions type', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText(/Permissions: write/)).toBeInTheDocument()
    })

    it('should show "View full configuration" button', () => {
      const capability = createMockAgentCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('View full configuration')).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    it('should apply correct source colors for user', () => {
      const capability = createMockMcpCapability()
      capability.source = 'user'
      render(<CapabilityRow capability={capability} />)
      const sourceBadge = screen.getByLabelText('Source: user')
      expect(sourceBadge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200')
    })

    it('should apply correct source colors for project', () => {
      const capability = createMockMcpCapability()
      capability.source = 'project'
      render(<CapabilityRow capability={capability} />)
      const sourceBadge = screen.getByLabelText('Source: project')
      expect(sourceBadge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200')
    })

    it('should apply correct source colors for local', () => {
      const capability = createMockMcpCapability()
      capability.source = 'local'
      render(<CapabilityRow capability={capability} />)
      const sourceBadge = screen.getByLabelText('Source: local')
      expect(sourceBadge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200')
    })

    it('should apply correct status colors for active', () => {
      const capability = createMockMcpCapability()
      capability.status = 'active'
      render(<CapabilityRow capability={capability} />)
      const statusDot = screen.getByLabelText('Status: active').parentElement
      expect(statusDot?.firstChild).toHaveClass('bg-green-500')
    })

    it('should apply correct status colors for inactive', () => {
      const capability = createMockMcpCapability()
      capability.status = 'inactive'
      render(<CapabilityRow capability={capability} />)
      const statusDot = screen.getByLabelText('Status: inactive').parentElement
      expect(statusDot?.firstChild).toHaveClass('bg-gray-400')
    })

    it('should apply correct status colors for error', () => {
      const capability = createMockMcpCapability()
      capability.status = 'error'
      render(<CapabilityRow capability={capability} />)
      const statusDot = screen.getByLabelText('Status: error').parentElement
      expect(statusDot?.firstChild).toHaveClass('bg-red-500')
    })
  })

  describe('Accessibility', () => {
    it('should have proper article role', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })

    it('should have aria-label with capability information', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'MCP server: Test MCP Server')
    })

    it('should have proper ARIA labels for badges', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByLabelText('Source: user')).toBeInTheDocument()
      expect(screen.getByLabelText('Type: mcp')).toBeInTheDocument()
      expect(screen.getByLabelText('Status: active')).toBeInTheDocument()
    })

    it('should have live region for status text', () => {
      const capability = createMockMcpCapability()
      render(<CapabilityRow capability={capability} />)
      const statusText = screen.getByText('active')
      expect(statusText).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('React.memo optimization', () => {
    it('should not re-render when capability data is the same', () => {
      const capability = createMockMcpCapability()
      const { rerender } = render(<CapabilityRow capability={capability} />)
      rerender(<CapabilityRow capability={capability} />)
      // If it re-renders, the test would need to use spyOn to verify
      // This is a basic test to ensure the component renders without errors
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument()
    })

    it('should handle capability with missing description', () => {
      const capability = createMockMcpCapability()
      capability.description = undefined
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument()
    })

    it('should handle capability with empty config', () => {
      const capability = createMockMcpCapability()
      if (capability.mcpData) {
        capability.mcpData.config = {}
      }
      render(<CapabilityRow capability={capability} />)
      expect(screen.getByText('Test MCP Server')).toBeInTheDocument()
    })
  })
})