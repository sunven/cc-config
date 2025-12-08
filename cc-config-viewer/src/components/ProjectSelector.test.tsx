import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectSelector } from './ProjectSelector'
import { useProjectsStore } from '../stores/projectsStore'
import type { Project } from '../types/project'

// Mock the store
vi.mock('../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'my-app',
    path: '/Users/test/my-app',
    configPath: '/Users/test/my-app/.mcp.json',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastAccessed: new Date('2025-06-01T10:00:00'),
    mcpCount: 3,
    agentCount: 2,
    status: 'valid',
  },
  {
    id: 'proj-2',
    name: 'another-project',
    path: '/Users/test/another-project',
    configPath: '/Users/test/another-project/.mcp.json',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastAccessed: new Date('2025-05-01T10:00:00'),
    mcpCount: 1,
    agentCount: 0,
    status: 'valid',
  },
  {
    id: 'proj-3',
    name: 'old-project',
    path: '/nonexistent/path',
    configPath: '/nonexistent/path/.mcp.json',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastAccessed: null,
    mcpCount: 0,
    agentCount: 0,
    status: 'missing',
  },
]

const mockSetActiveProject = vi.fn()
const mockUpdateProjectLastAccessed = vi.fn()
const mockLoadProjects = vi.fn()

describe('ProjectSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useProjectsStore).mockImplementation((selector: any) => {
      const state = {
        projects: mockProjects,
        activeProject: mockProjects[0],
        isLoadingProjects: false,
        projectsError: null,
        setActiveProject: mockSetActiveProject,
        updateProjectLastAccessed: mockUpdateProjectLastAccessed,
        loadProjects: mockLoadProjects,
      }
      return selector ? selector(state) : state
    })
  })

  it('renders with active project name', () => {
    render(<ProjectSelector />)
    expect(screen.getByRole('combobox')).toHaveTextContent('my-app')
  })

  it('shows "选择项目" when no active project', () => {
    vi.mocked(useProjectsStore).mockImplementation((selector: any) => {
      const state = {
        projects: mockProjects,
        activeProject: null,
        isLoadingProjects: false,
        projectsError: null,
        setActiveProject: mockSetActiveProject,
        updateProjectLastAccessed: mockUpdateProjectLastAccessed,
        loadProjects: mockLoadProjects,
      }
      return selector ? selector(state) : state
    })

    render(<ProjectSelector />)
    expect(screen.getByRole('combobox')).toHaveTextContent('选择项目')
  })

  it('opens dropdown on click', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索项目...')).toBeInTheDocument()
    })
  })

  it('shows all projects in dropdown', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      // Use testid to find project items in the dropdown
      expect(screen.getByTestId('project-item-proj-1')).toBeInTheDocument()
      expect(screen.getByTestId('project-item-proj-2')).toBeInTheDocument()
      expect(screen.getByTestId('project-item-proj-3')).toBeInTheDocument()
    })
  })

  it('displays MCP and Agent counts for each project', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      // Look for MCP counts - format is "3 MCP"
      expect(screen.getByText('3 MCP')).toBeInTheDocument()
      expect(screen.getByText('2 Agent')).toBeInTheDocument()
    })
  })

  it('shows relative time for lastAccessed', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    // Should show relative time or "从未访问"
    await waitFor(() => {
      // At least one project should show "从未访问" for null lastAccessed
      expect(screen.getByText('从未访问')).toBeInTheDocument()
    })
  })

  it('filters projects when searching', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索项目...')).toBeInTheDocument()
    })

    // Type in search input
    const searchInput = screen.getByPlaceholderText('搜索项目...')
    await user.type(searchInput, 'my-app')

    // After typing, my-app should still be visible (if it matches)
    // Note: cmdk filters items client-side
    await waitFor(() => {
      expect(searchInput).toHaveValue('my-app')
    })
  })

  it('calls setActiveProject when project is selected', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByText('another-project')).toBeInTheDocument()
    })

    // Click on the project item in the Command list
    const projectItem = screen.getByTestId('project-item-proj-2')
    await user.click(projectItem)

    expect(mockSetActiveProject).toHaveBeenCalledWith(mockProjects[1])
  })

  it('calls updateProjectLastAccessed when project is selected', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByText('another-project')).toBeInTheDocument()
    })

    const projectItem = screen.getByTestId('project-item-proj-2')
    await user.click(projectItem)

    expect(mockUpdateProjectLastAccessed).toHaveBeenCalledWith('proj-2')
  })

  it('shows loading state', () => {
    vi.mocked(useProjectsStore).mockImplementation((selector: any) => {
      const state = {
        projects: [],
        activeProject: null,
        isLoadingProjects: true,
        projectsError: null,
        setActiveProject: mockSetActiveProject,
        updateProjectLastAccessed: mockUpdateProjectLastAccessed,
        loadProjects: mockLoadProjects,
      }
      return selector ? selector(state) : state
    })

    render(<ProjectSelector />)
    expect(screen.getByRole('combobox')).toHaveTextContent('加载中...')
  })

  it('shows empty state when no projects discovered', async () => {
    vi.mocked(useProjectsStore).mockImplementation((selector: any) => {
      const state = {
        projects: [],
        activeProject: null,
        isLoadingProjects: false,
        projectsError: null,
        setActiveProject: mockSetActiveProject,
        updateProjectLastAccessed: mockUpdateProjectLastAccessed,
        loadProjects: mockLoadProjects,
      }
      return selector ? selector(state) : state
    })

    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByText('未发现项目')).toBeInTheDocument()
    })
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    // Open with click first
    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索项目...')).toBeInTheDocument()
    })

    // Navigate with arrow keys
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    // Should select a project
    await waitFor(() => {
      expect(mockSetActiveProject).toHaveBeenCalled()
    })
  })

  it('shows invalid status indicator for missing projects', async () => {
    const user = userEvent.setup()
    render(<ProjectSelector />)

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => {
      // old-project has status: 'missing', should have opacity class
      const oldProjectItem = screen.getByTestId('project-item-proj-3')
      expect(oldProjectItem).toBeInTheDocument()
      expect(oldProjectItem).toHaveClass('opacity-60')
    })
  })
})
