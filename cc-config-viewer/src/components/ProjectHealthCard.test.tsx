import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectHealthCard } from './ProjectHealthCard'
import { SourceIndicator } from './SourceIndicator'
import type { DiscoveredProject } from '../types/project'
import type { ProjectHealth } from '../types/health'

// Mock SourceIndicator
vi.mock('./SourceIndicator', () => ({
  SourceIndicator: ({ sourceType }: { sourceType: string }) => (
    <div data-testid="source-indicator">{sourceType}</div>
  ),
}))

describe('ProjectHealthCard', () => {
  const mockProject: DiscoveredProject = {
    id: 'project-1',
    name: 'Test Project',
    path: '/test/project',
    configFileCount: 3,
    lastModified: new Date('2025-01-01'),
    configSources: {
      user: true,
      project: true,
      local: false,
    },
  }

  const mockHealth: ProjectHealth = {
    projectId: 'project-1',
    status: 'good',
    score: 90,
    metrics: {
      totalCapabilities: 3,
      validConfigs: 3,
      invalidConfigs: 0,
      warnings: 0,
      errors: 0,
      lastChecked: '2025-01-01T00:00:00Z',
      lastAccessed: '2025-01-01T00:00:00Z',
    },
    issues: [],
    recommendations: ['Keep up the good work'],
  }

  it('renders project name and path', () => {
    render(<ProjectHealthCard project={mockProject} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('/test/project')).toBeInTheDocument()
  })

  it('displays project config count', () => {
    render(<ProjectHealthCard project={mockProject} />)

    expect(screen.getByText('3 config files')).toBeInTheDocument()
  })

  it('displays health status badge when health is provided', () => {
    render(<ProjectHealthCard project={mockProject} health={mockHealth} />)

    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('does not show health status when health is not provided', () => {
    render(<ProjectHealthCard project={mockProject} />)

    expect(screen.queryByText(/Good|Warning|Error/)).not.toBeInTheDocument()
  })

  it('displays health score and progress bar', () => {
    render(<ProjectHealthCard project={mockProject} health={mockHealth} />)

    expect(screen.getByText('90/100')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows correct progress bar color for good status', () => {
    const { container } = render(
      <ProjectHealthCard project={mockProject} health={mockHealth} />
    )

    const progressBar = container.querySelector('.bg-green-500')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows correct progress bar color for warning status', () => {
    const warningHealth = {
      ...mockHealth,
      status: 'warning' as const,
      score: 60,
    }

    const { container } = render(
      <ProjectHealthCard project={mockProject} health={warningHealth} />
    )

    const progressBar = container.querySelector('.bg-yellow-500')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows correct progress bar color for error status', () => {
    const errorHealth = {
      ...mockHealth,
      status: 'error' as const,
      score: 20,
    }

    const { container } = render(
      <ProjectHealthCard project={mockProject} health={errorHealth} />
    )

    const progressBar = container.querySelector('.bg-red-500')
    expect(progressBar).toBeInTheDocument()
  })

  it('displays error and warning counts when present', () => {
    const healthWithIssues = {
      ...mockHealth,
      status: 'warning' as const,
      metrics: {
        ...mockHealth.metrics,
        warnings: 2,
        errors: 1,
      },
    }

    render(<ProjectHealthCard project={mockProject} health={healthWithIssues} />)

    expect(screen.getByText('1 errors')).toBeInTheDocument()
    expect(screen.getByText('2 warnings')).toBeInTheDocument()
  })

  it('does not display errors/warnings when they are zero', () => {
    render(<ProjectHealthCard project={mockProject} health={mockHealth} />)

    expect(screen.queryByText(/errors/)).not.toBeInTheDocument()
    expect(screen.queryByText(/warnings/)).not.toBeInTheDocument()
  })

  it('renders Compare button when onCompare is provided', () => {
    const onCompare = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={mockHealth}
        onCompare={onCompare}
      />
    )

    const compareButton = screen.getByText('Compare')
    expect(compareButton).toBeInTheDocument()
  })

  it('renders View Details button when onViewDetails is provided', () => {
    const onViewDetails = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={mockHealth}
        onViewDetails={onViewDetails}
      />
    )

    const viewDetailsButton = screen.getByText('View Details')
    expect(viewDetailsButton).toBeInTheDocument()
  })

  it('disables Compare button when status is error', () => {
    const errorHealth = {
      ...mockHealth,
      status: 'error' as const,
    }

    const onCompare = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={errorHealth}
        onCompare={onCompare}
      />
    )

    const compareButton = screen.getByText('Compare')
    expect(compareButton).toBeDisabled()
  })

  it('calls onCompare when Compare button is clicked', () => {
    const onCompare = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={mockHealth}
        onCompare={onCompare}
      />
    )

    fireEvent.click(screen.getByText('Compare'))
    expect(onCompare).toHaveBeenCalledTimes(1)
  })

  it('calls onViewDetails when View Details button is clicked', () => {
    const onViewDetails = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={mockHealth}
        onViewDetails={onViewDetails}
      />
    )

    fireEvent.click(screen.getByText('View Details'))
    expect(onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no health data is available', () => {
    const onViewDetails = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={undefined}
        onViewDetails={onViewDetails}
      />
    )

    expect(screen.getByText('No health data available')).toBeInTheDocument()
    expect(screen.getByText('Check Health')).toBeInTheDocument()
  })

  it('calls onViewDetails when Check Health button is clicked', () => {
    const onViewDetails = vi.fn()
    render(
      <ProjectHealthCard
        project={mockProject}
        health={undefined}
        onViewDetails={onViewDetails}
      />
    )

    fireEvent.click(screen.getByText('Check Health'))
    expect(onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('applies selected styling when isSelected is true', () => {
    const { container } = render(
      <ProjectHealthCard project={mockProject} isSelected={true} />
    )

    expect(container.firstChild).toHaveClass('ring-2', 'ring-primary')
  })

  it('does not apply selected styling when isSelected is false', () => {
    const { container } = render(
      <ProjectHealthCard project={mockProject} isSelected={false} />
    )

    expect(container.firstChild).not.toHaveClass('ring-primary')
  })

  it('renders last modified date in relative format', () => {
    const recentProject = {
      ...mockProject,
      lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    }

    render(<ProjectHealthCard project={recentProject} />)

    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })

  it('shows valid configs count', () => {
    render(<ProjectHealthCard project={mockProject} health={mockHealth} />)

    expect(screen.getByText('3/3 valid')).toBeInTheDocument()
  })

  it('displays configuration sources with source indicators', () => {
    render(<ProjectHealthCard project={mockProject} health={mockHealth} />)

    // Check for the Configuration Sources section
    expect(screen.getByText('Configuration Sources')).toBeInTheDocument()

    // Check that source indicators are rendered for user and project sources
    const sourceIndicators = screen.getAllByTestId('source-indicator')
    expect(sourceIndicators).toHaveLength(2)
    expect(sourceIndicators[0]).toHaveTextContent('user')
    expect(sourceIndicators[1]).toHaveTextContent('project')
  })

  it('shows inherited source indicator when local is true', () => {
    const projectWithInherited = {
      ...mockProject,
      configSources: {
        user: false,
        project: false,
        local: true,
      },
    }

    render(<ProjectHealthCard project={projectWithInherited} />)

    const sourceIndicators = screen.getAllByTestId('source-indicator')
    expect(sourceIndicators).toHaveLength(1)
    expect(sourceIndicators[0]).toHaveTextContent('inherited')
  })

  it('shows all three source indicators when all sources are present', () => {
    const projectWithAllSources = {
      ...mockProject,
      configSources: {
        user: true,
        project: true,
        local: true,
      },
    }

    render(<ProjectHealthCard project={projectWithAllSources} />)

    const sourceIndicators = screen.getAllByTestId('source-indicator')
    expect(sourceIndicators).toHaveLength(3)
    expect(sourceIndicators[0]).toHaveTextContent('user')
    expect(sourceIndicators[1]).toHaveTextContent('project')
    expect(sourceIndicators[2]).toHaveTextContent('inherited')
  })

  it('does not show source indicators when no sources are configured', () => {
    const projectWithNoSources = {
      ...mockProject,
      configSources: {
        user: false,
        project: false,
        local: false,
      },
    }

    render(<ProjectHealthCard project={projectWithNoSources} />)

    // Section header should still be present
    expect(screen.getByText('Configuration Sources')).toBeInTheDocument()

    // But no source indicators should be rendered
    expect(screen.queryAllByTestId('source-indicator')).toHaveLength(0)
  })
})