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
})
