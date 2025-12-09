import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProjectList } from './ProjectList'
import type { DiscoveredProject } from '../types/project'

// Mock the project detection module
vi.mock('../lib/projectDetection', () => ({
  getDiscoveredProjects: vi.fn()
}))

describe('ProjectList', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    )

    render(<ProjectList />)

    expect(screen.getByText(/scanning for projects/i)).toBeInTheDocument()
  })

  it('renders error state when loading fails', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockRejectedValue(new Error('Failed to load'))

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText(/error loading projects/i)).toBeInTheDocument()
    })
  })

  it('renders project list when loaded successfully', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
      expect(screen.getByText('Project Two')).toBeInTheDocument()
      expect(screen.getByText('Project Three')).toBeInTheDocument()
    })

    expect(screen.getByText(/showing 3 of 3 projects/i)).toBeInTheDocument()
  })

  it('filters projects by search query', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search projects/i)
    fireEvent.change(searchInput, { target: { value: 'One' } })

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
      expect(screen.queryByText('Project Two')).not.toBeInTheDocument()
      expect(screen.queryByText('Project Three')).not.toBeInTheDocument()
    })

    expect(screen.getByText(/showing 1 of 3 projects/i)).toBeInTheDocument()
  })

  it('filters projects by config presence', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })

    const hasConfigButton = screen.getByText('Has Config')
    fireEvent.click(hasConfigButton)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
      expect(screen.getByText('Project Two')).toBeInTheDocument()
      expect(screen.queryByText('Project Three')).not.toBeInTheDocument()
    })

    expect(screen.getByText(/showing 2 of 3 projects/i)).toBeInTheDocument()
  })

  it('filters projects by agent presence', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })

    const hasAgentsButton = screen.getByText('Has Agents')
    fireEvent.click(hasAgentsButton)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
      expect(screen.queryByText('Project Two')).not.toBeInTheDocument()
      expect(screen.queryByText('Project Three')).not.toBeInTheDocument()
    })

    expect(screen.getByText(/showing 1 of 3 projects/i)).toBeInTheDocument()
  })

  it('resets filters when All button is clicked', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })

    // Apply a filter
    const hasConfigButton = screen.getByText('Has Config')
    fireEvent.click(hasConfigButton)

    await waitFor(() => {
      expect(screen.getByText(/showing 2 of 3 projects/i)).toBeInTheDocument()
    })

    // Reset to all
    const allButton = screen.getByText('All')
    fireEvent.click(allButton)

    await waitFor(() => {
      expect(screen.getByText(/showing 3 of 3 projects/i)).toBeInTheDocument()
    })
  })

  it('calls onProjectSelect when a project is clicked', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    const onProjectSelect = vi.fn()
    render(<ProjectList onProjectSelect={onProjectSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })

    const projectCard = screen.getByText('Project One').closest('div')?.parentElement
    fireEvent.click(projectCard!)

    expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0])
  })

  it('displays "no projects found" when list is empty', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue([])

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument()
    })
  })

  it('shows retry button when error occurs', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockRejectedValue(new Error('Failed to load'))

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument()
    })

    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    fireEvent.click(screen.getByText(/retry/i))

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })
  })

  it('displays config source badges correctly', async () => {
    const { getDiscoveredProjects } = await import('../lib/projectDetection')
    vi.mocked(getDiscoveredProjects).mockResolvedValue(mockProjects)

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument()
    })

    // Check that badges are rendered
    const userBadges = screen.queryAllByText('User')
    expect(userBadges.length).toBeGreaterThan(0)

    const projectBadges = screen.queryAllByText('Project')
    expect(projectBadges.length).toBeGreaterThan(0)
  })
})
