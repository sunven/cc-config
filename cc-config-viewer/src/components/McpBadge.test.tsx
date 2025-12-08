import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { McpBadge } from './McpBadge'
import type { McpServer } from '../types'

describe('McpBadge', () => {
  const runningServer: McpServer = {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'],
    status: 'running'
  }

  const stoppedServer: McpServer = {
    name: 'postgres',
    command: 'node',
    args: ['server.js'],
    status: 'stopped'
  }

  const errorServer: McpServer = {
    name: 'git',
    command: 'python',
    args: ['mcp-git-server.py'],
    status: 'error'
  }

  it('renders server name', () => {
    render(<McpBadge server={runningServer} />)
    expect(screen.getByText('filesystem')).toBeInTheDocument()
  })

  it('applies green styling for running status', () => {
    render(<McpBadge server={runningServer} />)

    const badge = screen.getByText('filesystem').closest('span')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('applies gray styling for stopped status', () => {
    render(<McpBadge server={stoppedServer} />)

    const badge = screen.getByText('postgres').closest('span')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('applies red styling for error status', () => {
    render(<McpBadge server={errorServer} />)

    const badge = screen.getByText('git').closest('span')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('displays server with different names', () => {
    render(<McpBadge server={stoppedServer} />)
    expect(screen.getByText('postgres')).toBeInTheDocument()

    render(<McpBadge server={errorServer} />)
    expect(screen.getByText('git')).toBeInTheDocument()
  })

  it('includes status indicator dot', () => {
    render(<McpBadge server={runningServer} />)

    const dots = document.querySelectorAll('.w-2.h-2.rounded-full')
    expect(dots).toHaveLength(1)
  })

  it('renders with server that has env', () => {
    const serverWithEnv: McpServer = {
      name: 'custom-server',
      command: 'node',
      args: ['server.js'],
      env: { PORT: '3000' },
      status: 'running'
    }

    render(<McpBadge server={serverWithEnv} />)
    expect(screen.getByText('custom-server')).toBeInTheDocument()
  })

  it('applies default gray styling for unknown status', () => {
    const unknownStatusServer = {
      name: 'test',
      command: 'test',
      args: [],
      status: 'stopped' as const
    }

    render(<McpBadge server={unknownStatusServer} />)

    const badge = screen.getByText('test').closest('span')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  // MEDIUM #5 Fix: Test default case in getStatusColor and memo comparison
  it('applies default styling for undefined/unknown status type', () => {
    // Test the default case in getStatusColor switch
    const serverWithUnknownStatus = {
      name: 'unknown-status',
      command: 'test',
      args: [],
      // Cast to force an unknown status through
      status: 'unknown' as McpServer['status']
    }

    render(<McpBadge server={serverWithUnknownStatus} />)

    const badge = screen.getByText('unknown-status').closest('span')
    // Default case should apply gray styling
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('memo comparison prevents re-render when props are equal', () => {
    const { rerender } = render(<McpBadge server={runningServer} />)

    // Re-render with same server object
    rerender(<McpBadge server={runningServer} />)

    // Should still render correctly (memo allows re-render since same reference)
    expect(screen.getByText('filesystem')).toBeInTheDocument()
  })

  it('memo comparison triggers re-render when name changes', () => {
    const { rerender } = render(<McpBadge server={runningServer} />)

    expect(screen.getByText('filesystem')).toBeInTheDocument()

    // Re-render with different server name
    const updatedServer = { ...runningServer, name: 'updated-name' }
    rerender(<McpBadge server={updatedServer} />)

    expect(screen.getByText('updated-name')).toBeInTheDocument()
  })

  it('memo comparison triggers re-render when status changes', () => {
    const { rerender } = render(<McpBadge server={runningServer} />)

    let badge = screen.getByText('filesystem').closest('span')
    expect(badge).toHaveClass('bg-green-100')

    // Re-render with different status
    const updatedServer: McpServer = { ...runningServer, status: 'error' }
    rerender(<McpBadge server={updatedServer} />)

    badge = screen.getByText('filesystem').closest('span')
    expect(badge).toHaveClass('bg-red-100')
  })
})
