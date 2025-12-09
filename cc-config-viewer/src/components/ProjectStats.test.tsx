import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectStats } from './ProjectStats'
import type { DiscoveredProject } from '../types/project'

describe('ProjectStats', () => {
  const mockProjects: DiscoveredProject[] = [
    {
      id: '1',
      name: 'Project One',
      path: '/home/user/projects/project-one',
      configFileCount: 2,
      lastModified: new Date('2024-01-15'),
      configSources: { user: true, project: true, local: false },
      mcpServers: ['2 servers'],
      subAgents: ['3 agents']
    },
    {
      id: '2',
      name: 'Project Two',
      path: '/home/user/projects/project-two',
      configFileCount: 1,
      lastModified: new Date('2024-02-20'),
      configSources: { user: false, project: true, local: false },
      mcpServers: ['1 server']
    },
    {
      id: '3',
      name: 'Project Three',
      path: '/home/user/projects/project-three',
      configFileCount: 0,
      lastModified: new Date('2024-03-10'),
      configSources: { user: false, project: false, local: false }
    }
  ]

  it('renders statistics correctly', () => {
    render(<ProjectStats projects={mockProjects} />)

    expect(screen.getByText('Total Projects')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    expect(screen.getByText('With Config')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()

    expect(screen.getByText('With Agents')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()

    expect(screen.getByText('Active Servers')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // 2 + 1
  })

  it('displays summary information', () => {
    render(<ProjectStats projects={mockProjects} />)

    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('3 total config files')).toBeInTheDocument()
    expect(screen.getByText('67% have configuration')).toBeInTheDocument()
    expect(screen.getByText('33% have agents')).toBeInTheDocument()
  })

  it('handles empty project list', () => {
    render(<ProjectStats projects={[]} />)

    expect(screen.getByText('Project Statistics')).toBeInTheDocument()
    expect(screen.getByText('No projects to display')).toBeInTheDocument()
  })

  it('calculates correct percentages', () => {
    const projectsWithConfig = mockProjects.filter(p => p.configFileCount > 0).length
    const percentage = Math.round((projectsWithConfig / mockProjects.length) * 100)

    render(<ProjectStats projects={mockProjects} />)

    expect(screen.getByText(`${percentage}% have configuration`)).toBeInTheDocument()
  })

  it('shows zero values when no projects match criteria', () => {
    const noConfigProjects: DiscoveredProject[] = [
      {
        id: '1',
        name: 'Project No Config',
        path: '/home/user/projects/no-config',
        configFileCount: 0,
        lastModified: new Date('2024-01-15'),
        configSources: { user: false, project: false, local: false }
      }
    ]

    render(<ProjectStats projects={noConfigProjects} />)

    expect(screen.getByText('With Config')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0% have configuration')).toBeInTheDocument()
  })

  it('displays all stat cards with icons', () => {
    render(<ProjectStats projects={mockProjects} />)

    // Check that stat cards are rendered
    expect(screen.getByText('Total Projects')).toBeInTheDocument()
    expect(screen.getByText('With Config')).toBeInTheDocument()
    expect(screen.getByText('With Agents')).toBeInTheDocument()
    expect(screen.getByText('Active Servers')).toBeInTheDocument()
  })

  it('calculates total MCP servers correctly from array strings', () => {
    const projectsWithMultipleServers: DiscoveredProject[] = [
      {
        id: '1',
        name: 'Project Multi',
        path: '/home/user/projects/multi',
        configFileCount: 1,
        lastModified: new Date('2024-01-15'),
        configSources: { user: false, project: true, local: false },
        mcpServers: ['5 servers', '3 servers']
      }
    ]

    render(<ProjectStats projects={projectsWithMultipleServers} />)

    // Should sum up all servers: 5 + 3 = 8
    expect(screen.getByText('Active Servers')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('handles projects without mcpServers array', () => {
    const projectWithoutMcp: DiscoveredProject = {
      id: '1',
      name: 'Project No MCP',
      path: '/home/user/projects/no-mcp',
      configFileCount: 1,
      lastModified: new Date('2024-01-15'),
      configSources: { user: false, project: true, local: false }
    }

    render(<ProjectStats projects={[projectWithoutMcp]}>)

    expect(screen.getByText('Active Servers')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
