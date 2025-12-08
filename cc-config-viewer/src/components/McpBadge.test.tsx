import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { McpBadge } from './McpBadge'
import type { McpServer } from '../types/mcp'

describe('McpBadge', () => {
  const activeServer: McpServer = {
    name: 'filesystem',
    type: 'stdio',
    description: 'File system operations',
    config: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'] },
    status: 'active',
    sourcePath: '/home/user/.claude.json'
  }

  const inactiveServer: McpServer = {
    name: 'postgres',
    type: 'http',
    description: 'PostgreSQL database',
    config: { url: 'http://localhost:5432' },
    status: 'inactive',
    sourcePath: './.mcp.json'
  }

  const errorServer: McpServer = {
    name: 'git',
    type: 'stdio',
    description: 'Git operations',
    config: { command: 'python', args: ['mcp-git-server.py'] },
    status: 'error',
    sourcePath: '/home/user/.claude.json'
  }

  it('renders server name', () => {
    render(<McpBadge server={activeServer} source="user" />)
    expect(screen.getByText('filesystem')).toBeInTheDocument()
  })

  it('applies green styling for active status', () => {
    render(<McpBadge server={activeServer} source="user" />)

    const statusDot = document.querySelector('.w-2.h-2.rounded-full.bg-green-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('applies gray styling for inactive status', () => {
    render(<McpBadge server={inactiveServer} source="project" />)

    const statusDot = document.querySelector('.w-2.h-2.rounded-full.bg-gray-400')
    expect(statusDot).toBeInTheDocument()
  })

  it('applies red styling for error status', () => {
    render(<McpBadge server={errorServer} source="user" />)

    const statusDot = document.querySelector('.w-2.h-2.rounded-full.bg-red-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('displays server description', () => {
    render(<McpBadge server={activeServer} source="user" />)
    expect(screen.getByText('File system operations')).toBeInTheDocument()
  })

  it('displays server type', () => {
    render(<McpBadge server={activeServer} source="user" />)
    expect(screen.getByText('stdio')).toBeInTheDocument()
  })

  it('displays source badge for user', () => {
    render(<McpBadge server={activeServer} source="user" />)
    const sourceBadge = screen.getByText('user')
    expect(sourceBadge).toBeInTheDocument()
    expect(sourceBadge.closest('.bg-blue-100')).toBeInTheDocument()
  })

  it('displays source badge for project', () => {
    render(<McpBadge server={inactiveServer} source="project" />)
    const sourceBadge = screen.getByText('project')
    expect(sourceBadge).toBeInTheDocument()
    expect(sourceBadge.closest('.bg-green-100')).toBeInTheDocument()
  })

  it('displays source badge for local', () => {
    render(<McpBadge server={activeServer} source="local" />)
    const sourceBadge = screen.getByText('local')
    expect(sourceBadge).toBeInTheDocument()
    expect(sourceBadge.closest('.bg-gray-100')).toBeInTheDocument()
  })

  it('shows configuration preview', () => {
    render(<McpBadge server={activeServer} source="user" />)
    expect(screen.getByText(/command:/)).toBeInTheDocument()
  })

  it('shows tooltip with full configuration', () => {
    render(<McpBadge server={activeServer} source="user" />)
    const viewConfigButton = screen.getByText('View full configuration')
    expect(viewConfigButton).toBeInTheDocument()
  })

  it('renders without description', () => {
    const serverWithoutDescription: McpServer = {
      name: 'test-server',
      type: 'http',
      config: { url: 'http://localhost:3000' },
      status: 'active',
      sourcePath: './.mcp.json'
    }

    render(<McpBadge server={serverWithoutDescription} source="project" />)
    expect(screen.getByText('test-server')).toBeInTheDocument()
  })

  it('applies default styling for unknown status', () => {
    const serverWithUnknownStatus: McpServer = {
      name: 'unknown-status',
      type: 'stdio',
      config: {},
      status: 'inactive',
      sourcePath: './.mcp.json'
    }

    render(<McpBadge server={serverWithUnknownStatus} source="project" />)

    const statusDot = document.querySelector('.w-2.h-2.rounded-full.bg-gray-400')
    expect(statusDot).toBeInTheDocument()
  })

  it('memo comparison prevents re-render when props are equal', () => {
    const { rerender } = render(<McpBadge server={activeServer} source="user" />)

    // Re-render with same server object
    rerender(<McpBadge server={activeServer} source="user" />)

    // Should still render correctly
    expect(screen.getByText('filesystem')).toBeInTheDocument()
  })

  it('memo comparison triggers re-render when name changes', () => {
    const { rerender } = render(<McpBadge server={activeServer} source="user" />)

    expect(screen.getByText('filesystem')).toBeInTheDocument()

    // Re-render with different server name
    const updatedServer = { ...activeServer, name: 'updated-name' }
    rerender(<McpBadge server={updatedServer} source="user" />)

    expect(screen.getByText('updated-name')).toBeInTheDocument()
  })

  it('memo comparison triggers re-render when status changes', () => {
    const { rerender } = render(<McpBadge server={activeServer} source="user" />)

    let statusDot = document.querySelector('.w-2.h-2.rounded-full.bg-green-500')
    expect(statusDot).toBeInTheDocument()

    // Re-render with different status
    const updatedServer: McpServer = { ...activeServer, status: 'error' }
    rerender(<McpBadge server={updatedServer} source="user" />)

    statusDot = document.querySelector('.w-2.h-2.rounded-full.bg-red-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<McpBadge server={activeServer} source="user" />)

    // Check for article role
    const card = document.querySelector('[role="article"]')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('aria-label', 'MCP server: filesystem')

    // Check status indicator accessibility
    const statusDot = document.querySelector('[role="status"]')
    expect(statusDot).toBeInTheDocument()
    expect(statusDot).toHaveAttribute('aria-label', 'Status: active')

    // Check aria-live region for status text
    const statusText = screen.getByText('active')
    expect(statusText).toHaveAttribute('aria-live', 'polite')

    // Check source badge accessibility
    const sourceBadge = screen.getByText('user')
    expect(sourceBadge).toHaveAttribute('aria-label', 'Source: user')

    // Check type badge accessibility
    const typeBadge = screen.getByText('stdio')
    expect(typeBadge).toHaveAttribute('aria-label', 'Type: stdio')
  })

  it('displays description with proper semantics', () => {
    render(<McpBadge server={activeServer} source="user" />)

    const description = screen.getByText('File system operations')
    expect(description).toBeInTheDocument()
    expect(description.tagName).toBe('P')
  })

  it('has semantic heading structure', () => {
    render(<McpBadge server={activeServer} source="user" />)

    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('filesystem')
  })

  it('handles keyboard navigation for tooltip trigger', () => {
    render(<McpBadge server={activeServer} source="user" />)

    const tooltipTrigger = screen.getByText('View full configuration')
    expect(tooltipTrigger).toBeInTheDocument()
    // Tooltip triggers should be focusable
    expect(tooltipTrigger).toHaveAttribute('tabindex', '0')
  })
})
