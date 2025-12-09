import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentBadge } from './AgentBadge'
import type { Agent } from '../types/agent'

describe('AgentBadge', () => {
  const activeAgent: Agent = {
    id: 'agent-1',
    name: 'Code Assistant',
    description: 'Helps with code completion and refactoring',
    model: {
      name: 'claude-3-sonnet',
      provider: 'anthropic',
      config: { temperature: 0.7, max_tokens: 4096 }
    },
    permissions: {
      type: 'write',
      scopes: ['files:read', 'files:write', 'shell:execute']
    },
    status: 'active',
    sourcePath: '/home/user/.claude/agents/code-assistant.md'
  }

  const inactiveAgent: Agent = {
    id: 'agent-2',
    name: 'Data Analyst',
    description: 'Analyzes data and generates reports',
    model: {
      name: 'claude-3-haiku',
      provider: 'anthropic'
    },
    permissions: {
      type: 'read',
      scopes: ['files:read']
    },
    status: 'inactive',
    sourcePath: './.claude/agents/data-analyst.md'
  }

  const adminAgent: Agent = {
    id: 'agent-3',
    name: 'System Admin',
    description: 'Manages system configuration and users',
    model: {
      name: 'claude-3-opus',
      provider: 'anthropic',
      config: { temperature: 0.5 }
    },
    permissions: {
      type: 'admin',
      scopes: ['files:read', 'files:write', 'shell:execute', 'system:admin'],
      restrictions: ['no_delete']
    },
    status: 'active',
    sourcePath: '/home/user/.claude/agents/system-admin.md'
  }

  it('renders agent name', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
  })

  it('applies blue styling for user source', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    const sourceBadge = screen.getByText('user')
    expect(sourceBadge).toBeInTheDocument()
    expect(sourceBadge.closest('.bg-blue-100')).toBeInTheDocument()
  })

  it('applies green styling for project source', () => {
    render(<AgentBadge agent={inactiveAgent} source="project" />)
    const sourceBadge = screen.getByText('project')
    expect(sourceBadge).toBeInTheDocument()
    expect(sourceBadge.closest('.bg-green-100')).toBeInTheDocument()
  })

  it('applies gray styling for local source', () => {
    render(<AgentBadge agent={activeAgent} source="local" />)
    const sourceBadge = screen.getByText('local')
    expect(sourceBadge).toBeInTheDocument()
    expect(sourceBadge.closest('.bg-gray-100')).toBeInTheDocument()
  })

  it('displays agent description', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('Helps with code completion and refactoring')).toBeInTheDocument()
  })

  it('displays permissions type', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('write')).toBeInTheDocument()
  })

  it('displays status', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('shows model preview', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText(/claude-3-sonnet/)).toBeInTheDocument()
  })

  it('shows model provider when available', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText(/anthropic/)).toBeInTheDocument()
  })

  it('displays read permission badge', () => {
    render(<AgentBadge agent={inactiveAgent} source="user" />)
    const permissionBadge = screen.getByText('read')
    expect(permissionBadge).toBeInTheDocument()
    expect(permissionBadge.closest('.bg-blue-100')).toBeInTheDocument()
  })

  it('displays write permission badge', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    const permissionBadge = screen.getByText('write')
    expect(permissionBadge).toBeInTheDocument()
    expect(permissionBadge.closest('.bg-green-100')).toBeInTheDocument()
  })

  it('displays admin permission badge', () => {
    render(<AgentBadge agent={adminAgent} source="user" />)
    const permissionBadge = screen.getByText('admin')
    expect(permissionBadge).toBeInTheDocument()
    expect(permissionBadge.closest('.bg-red-100')).toBeInTheDocument()
  })

  it('displays custom permission badge', () => {
    const customAgent: Agent = {
      ...activeAgent,
      permissions: {
        type: 'custom',
        scopes: ['custom:scope']
      }
    }
    render(<AgentBadge agent={customAgent} source="user" />)
    const permissionBadge = screen.getByText('custom')
    expect(permissionBadge).toBeInTheDocument()
    expect(permissionBadge.closest('.bg-purple-100')).toBeInTheDocument()
  })

  it('shows configuration preview', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText(/temperature:/)).toBeInTheDocument()
  })

  it('shows scopes in tooltip', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    const viewConfigButton = screen.getByText('View full configuration')
    expect(viewConfigButton).toBeInTheDocument()
  })

  it('renders without description', () => {
    const agentWithoutDescription: Agent = {
      ...activeAgent,
      description: ''
    }
    render(<AgentBadge agent={agentWithoutDescription} source="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
  })

  it('applies default styling for unknown permissions type', () => {
    const agentWithUnknownPermissions: Agent = {
      ...activeAgent,
      permissions: {
        type: 'read',
        scopes: ['files:read']
      }
    }
    render(<AgentBadge agent={agentWithUnknownPermissions} source="user" />)
    const permissionBadge = screen.getByText('read')
    expect(permissionBadge).toBeInTheDocument()
  })

  it('memo comparison prevents re-render when props are equal', () => {
    const { rerender } = render(<AgentBadge agent={activeAgent} source="user" />)
    rerender(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
  })

  it('memo comparison triggers re-render when name changes', () => {
    const { rerender } = render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('Code Assistant')).toBeInTheDocument()
    const updatedAgent = { ...activeAgent, name: 'Updated Assistant' }
    rerender(<AgentBadge agent={updatedAgent} source="user" />)
    expect(screen.getByText('Updated Assistant')).toBeInTheDocument()
  })

  it('memo comparison triggers re-render when status changes', () => {
    const { rerender } = render(<AgentBadge agent={activeAgent} source="user" />)
    expect(screen.getByText('active')).toBeInTheDocument()
    const updatedAgent = { ...activeAgent, status: 'inactive' as const }
    rerender(<AgentBadge agent={updatedAgent} source="user" />)
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    const card = document.querySelector('[role="article"]')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('aria-label', 'Agent: Code Assistant')

    const sourceBadge = screen.getByText('user')
    expect(sourceBadge).toHaveAttribute('aria-label', 'Source: user')

    const permissionBadge = screen.getByText('write')
    expect(permissionBadge).toHaveAttribute('aria-label', 'Permissions: write')

    const statusDot = document.querySelector('[role="status"]')
    expect(statusDot).toHaveAttribute('aria-label', 'Status: active')
  })

  it('displays description with proper semantics', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    const description = screen.getByText('Helps with code completion and refactoring')
    expect(description).toBeInTheDocument()
    expect(description.tagName).toBe('P')
  })

  it('has semantic heading structure', () => {
    render(<AgentBadge agent={activeAgent} source="user" />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Code Assistant')
  })

  it('handles markdown description', () => {
    const agentWithMarkdown: Agent = {
      ...activeAgent,
      description: '**Bold** and *italic* text'
    }
    render(<AgentBadge agent={agentWithMarkdown} source="user" />)
    expect(screen.getByText('**Bold** and *italic* text')).toBeInTheDocument()
  })
})
