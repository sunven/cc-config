import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectCard } from './ProjectCard'
import type { DiscoveredProject } from '../types/project'

describe('ProjectCard', () => {
  const mockProject: DiscoveredProject = {
    id: '1',
    name: 'Test Project',
    path: '/home/user/projects/test-project',
    configFileCount: 3,
    lastModified: new Date('2024-01-15'),
    configSources: { user: true, project: true, local: false },
    mcpServers: ['2 servers'],
    subAgents: ['3 agents']
  }

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('/home/user/projects/test-project')).toBeInTheDocument()
    expect(screen.getByText('3 files')).toBeInTheDocument()
  })

  it('displays config source badges', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
    expect(screen.queryByText('Local')).not.toBeInTheDocument()
  })

  it('displays MCP servers information', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('2 servers')).toBeInTheDocument()
  })

  it('displays sub-agents information', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('3 agents')).toBeInTheDocument()
  })

  it('handles projects without MCP servers', () => {
    const projectWithoutMcp: DiscoveredProject = {
      ...mockProject,
      mcpServers: undefined
    }

    render(<ProjectCard project={projectWithoutMcp} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    // Should not crash, just not show servers
  })

  it('handles projects without sub-agents', () => {
    const projectWithoutAgents: DiscoveredProject = {
      ...mockProject,
      subAgents: undefined
    }

    render(<ProjectCard project={projectWithoutAgents} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    // Should not crash, just not show agents
  })

  it('handles projects with no config files', () => {
    const projectNoConfig: DiscoveredProject = {
      ...mockProject,
      configFileCount: 0,
      configSources: { user: false, project: false, local: false }
    }

    render(<ProjectCard project={projectNoConfig} />)

    expect(screen.getByText('0 files')).toBeInTheDocument()
    expect(screen.queryByText('User')).not.toBeInTheDocument()
    expect(screen.queryByText('Project')).not.toBeInTheDocument()
    expect(screen.queryByText('Local')).not.toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<ProjectCard project={mockProject} onClick={handleClick} />)

    fireEvent.click(screen.getByText('Test Project'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when not provided', () => {
    render(<ProjectCard project={mockProject} />)

    // Should not crash when clicked without onClick handler
    fireEvent.click(screen.getByText('Test Project'))
  })

  it('applies custom className', () => {
    const { container } = render(
      <ProjectCard project={mockProject} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('formats last modified date correctly', () => {
    const today = new Date()
    const projectToday: DiscoveredProject = {
      ...mockProject,
      lastModified: today
    }

    render(<ProjectCard project={projectToday} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('shows relative time for recent dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const projectYesterday: DiscoveredProject = {
      ...mockProject,
      lastModified: yesterday
    }

    render(<ProjectCard project={projectYesterday} />)

    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })

  it('shows weeks for dates older than a week', () => {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const projectTwoWeeks: DiscoveredProject = {
      ...mockProject,
      lastModified: twoWeeksAgo
    }

    render(<ProjectCard project={projectTwoWeeks} />)

    expect(screen.getByText('2 weeks ago')).toBeInTheDocument()
  })
})
