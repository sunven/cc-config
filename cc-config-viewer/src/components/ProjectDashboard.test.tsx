import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ProjectDashboard } from './ProjectDashboard'
import { useProjectsStore } from '../stores/projectsStore'
import { useProjectComparison } from '../hooks/useProjectComparison'
import type { DiscoveredProject, Project } from '../types/project'

// Mock the store
vi.mock('../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

// Mock useProjectComparison hook
vi.mock('../hooks/useProjectComparison', () => ({
  useProjectComparison: vi.fn(),
}))

// Mock the components
vi.mock('./ProjectHealthCard', () => ({
  ProjectHealthCard: ({ project, onCompare, onViewDetails }: any) => (
    <div data-testid="project-card">
      <div>{project.name}</div>
      <button data-testid="compare-btn" onClick={onCompare}>Compare</button>
      <button data-testid="details-btn" onClick={onViewDetails}>View Details</button>
    </div>
  ),
}))

vi.mock('./HealthStatusBadge', () => ({
  HealthStatusBadge: ({ status }: any) => (
    <span data-testid="health-badge">{status}</span>
  ),
}))

const mockUseProjectsStore = vi.mocked(useProjectsStore)
const mockUseProjectComparison = vi.mocked(useProjectComparison)

describe('ProjectDashboard', () => {
  const mockProjects: DiscoveredProject[] = [
    {
      id: 'project-1',
      name: 'Project Alpha',
      path: '/path/to/alpha',
      configFileCount: 10,
      lastModified: Math.floor(Date.now() / 1000),
      configSources: { user: false, project: true, local: false },
    },
    {
      id: 'project-2',
      name: 'Project Beta',
      path: '/path/to/beta',
      configFileCount: 8,
      lastModified: Math.floor(Date.now() / 1000),
      configSources: { user: false, project: true, local: false },
    },
  ]

  const mockDashboardState = {
    sortBy: 'health' as const,
    filterBy: 'all' as const,
    selectedProjects: [],
    healthMetrics: [],
    isRefreshing: false,
  }

  const mockComparison = {
    leftProject: null,
    rightProject: null,
    isComparing: false,
    diffResults: [],
    comparisonMode: 'capabilities' as const,
  }

  const mockStore = {
    projects: mockProjects,
    dashboard: mockDashboardState,
    comparison: mockComparison,
    setDashboardFilters: vi.fn(),
    refreshAllProjectHealth: vi.fn(),
  }

  const mockStartComparison = vi.fn()
  const mockOnViewCapabilities = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProjectsStore.mockReturnValue(mockStore as any)
    mockUseProjectComparison.mockReturnValue({
      startComparison: mockStartComparison,
      refreshComparison: vi.fn(),
      exitComparison: vi.fn(),
      leftProject: null,
      rightProject: null,
      isComparing: false,
      diffResults: [],
      comparisonMode: 'capabilities',
    } as any)
  })

  it('renders dashboard header with title', () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    expect(screen.getByText('Project Health Dashboard')).toBeInTheDocument()
  })

  it('renders grid of project cards', () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    expect(screen.getAllByTestId('project-card')).toHaveLength(2)
    expect(screen.getByText('Project Alpha')).toBeInTheDocument()
    expect(screen.getByText('Project Beta')).toBeInTheDocument()
  })

  it('shows filter controls', () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    // Check for filter buttons
    expect(screen.getByText('all')).toBeInTheDocument()
    expect(screen.getByText('good')).toBeInTheDocument()
    expect(screen.getByText('warning')).toBeInTheDocument()
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('shows sort controls', () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    // Check for sort options
    expect(screen.getByText('health')).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('Last Accessed')).toBeInTheDocument()
  })

  it('calls setDashboardFilters when filter changes', async () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    const filterButton = screen.getByText('good')
    filterButton.click()

    await waitFor(() => {
      expect(mockStore.setDashboardFilters).toHaveBeenCalledWith({ filterBy: 'good' })
    })
  })

  it('calls setDashboardFilters when sort changes', async () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    const sortButton = screen.getByText('name')
    sortButton.click()

    await waitFor(() => {
      expect(mockStore.setDashboardFilters).toHaveBeenCalledWith({ sortBy: 'name' })
    })
  })

  it('calls refreshAllProjectHealth on mount', () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    expect(mockStore.refreshAllProjectHealth).toHaveBeenCalled()
  })

  it('shows loading state when refreshing', () => {
    mockUseProjectsStore.mockReturnValue({
      ...mockStore,
      dashboard: { ...mockDashboardState, isRefreshing: true },
    } as any)

    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    expect(screen.getByText('Refreshing...')).toBeInTheDocument()
  })

  it('shows empty state when no projects', () => {
    mockUseProjectsStore.mockReturnValue({
      ...mockStore,
      projects: [],
    } as any)

    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    expect(screen.getByText('No projects found')).toBeInTheDocument()
  })

  it('filters projects by health status', () => {
    const storeWithMetrics = {
      ...mockStore,
      dashboard: {
        ...mockDashboardState,
        filterBy: 'good',
        healthMetrics: [
          {
            projectId: 'project-1',
            totalCapabilities: 10,
            validConfigs: 10,
            invalidConfigs: 0,
            warningCount: 0,
            errorCount: 0,
            lastModified: '2024-01-01',
            healthScore: 100,
          },
          {
            projectId: 'project-2',
            totalCapabilities: 10,
            validConfigs: 10,
            invalidConfigs: 0,
            warningCount: 0,
            errorCount: 0,
            lastModified: '2024-01-01',
            healthScore: 100,
          },
        ],
      },
    }

    mockUseProjectsStore.mockReturnValue(storeWithMetrics as any)

    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    // Should render the project cards
    expect(screen.getAllByTestId('project-card')).toHaveLength(2)
  })

  it('sorts projects by health score', () => {
    const storeWithMetrics = {
      ...mockStore,
      dashboard: {
        ...mockDashboardState,
        sortBy: 'health',
        healthMetrics: [
          {
            projectId: 'project-1',
            totalCapabilities: 10,
            validConfigs: 10,
            invalidConfigs: 0,
            warningCount: 0,
            errorCount: 0,
            lastModified: '2024-01-01',
            healthScore: 90,
          },
          {
            projectId: 'project-2',
            totalCapabilities: 10,
            validConfigs: 10,
            invalidConfigs: 0,
            warningCount: 0,
            errorCount: 0,
            lastModified: '2024-01-01',
            healthScore: 95,
          },
        ],
      },
    }

    mockUseProjectsStore.mockReturnValue(storeWithMetrics as any)

    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    // Should render in order (higher health score first)
    const cards = screen.getAllByTestId('project-card')
    // Check first card has Project Beta (95 score)
    expect(cards[0]).toContainElement(
      screen.getByText('Project Beta')
    )
    // Check second card has Project Alpha (90 score)
    expect(cards[1]).toContainElement(
      screen.getByText('Project Alpha')
    )
  })

  it('calls onViewCapabilities when View Details is clicked', async () => {
    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    const detailsButton = screen.getAllByTestId('details-btn')[0]
    detailsButton.click()

    await waitFor(() => {
      expect(mockOnViewCapabilities).toHaveBeenCalled()
    })
  })

  it('renders dashboard with multiple projects within performance budget', async () => {
    const startTime = performance.now()

    render(<ProjectDashboard onViewCapabilities={mockOnViewCapabilities} />)

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Performance target: <200ms render time
    expect(renderTime).toBeLessThan(200)

    // Verify all projects are rendered
    expect(screen.getAllByTestId('project-card')).toHaveLength(2)
  })
})
