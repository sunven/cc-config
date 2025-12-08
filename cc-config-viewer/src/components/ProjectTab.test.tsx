import { describe, it, expect, vi, type Mock } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectTab } from './ProjectTab'
import { useUiStore } from '../stores/uiStore'
import { useConfigStore } from '../stores/configStore'
import type { Project } from '../types/project'

// Create a mock project for testing
const mockProject: Project = {
  id: 'test-123',
  name: 'test-project',
  path: '/test/project',
  configPath: '/test/project/.mcp.json',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Mock the stores
vi.mock('../stores/uiStore', () => ({
  useUiStore: vi.fn(),
}))

vi.mock('../stores/configStore', () => ({
  useConfigStore: vi.fn(),
}))

const mockUseUiStore = useUiStore as unknown as Mock
const mockUseConfigStore = useConfigStore as unknown as Mock

describe('ProjectTab', () => {
  const mockSetCurrentScope = vi.fn()
  const mockSwitchToScope = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation supporting selector patterns
    mockUseUiStore.mockImplementation((selector) => {
      const state = {
        currentScope: 'user',
        setCurrentScope: mockSetCurrentScope,
        isLoading: false,
        sidebarOpen: true,
        theme: 'light',
        setLoading: vi.fn(),
        setSidebarOpen: vi.fn(),
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      }
      return typeof selector === 'function' ? selector(state) : state
    })

    mockUseConfigStore.mockImplementation((selector) => {
      const state = {
        configs: [],
        inheritanceChain: { entries: [], resolved: {} },
        updateConfigs: vi.fn(),
        updateConfig: vi.fn(),
        clearConfigs: vi.fn(),
        switchToScope: mockSwitchToScope,
      }
      return typeof selector === 'function' ? selector(state) : state
    })
  })

  it('renders with user scope and correct label', () => {
    mockUseUiStore.mockImplementation((selector) => {
      const state = {
        currentScope: 'project',
        setCurrentScope: mockSetCurrentScope,
      }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(<ProjectTab scope="user" />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('用户级')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('renders with project scope and project name', () => {
    render(<ProjectTab scope="project" project={mockProject} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('test-project')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
  })

  it('applies active styling when current scope matches', () => {
    mockUseUiStore.mockImplementation((selector) => {
      const state = {
        currentScope: 'user',
        setCurrentScope: mockSetCurrentScope,
      }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(<ProjectTab scope="user" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies inactive styling when current scope does not match', () => {
    mockUseUiStore.mockImplementation((selector) => {
      const state = {
        currentScope: 'project',
        setCurrentScope: mockSetCurrentScope,
      }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(<ProjectTab scope="user" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300')
  })

  it('calls setCurrentScope and switchToScope when clicked', () => {
    mockUseUiStore.mockImplementation((selector) => {
      const state = {
        currentScope: 'project',
        setCurrentScope: mockSetCurrentScope,
      }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(<ProjectTab scope="user" />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetCurrentScope).toHaveBeenCalledWith('user')
    expect(mockSwitchToScope).toHaveBeenCalledWith('user')
  })

  it('displays blue badge for user scope', () => {
    render(<ProjectTab scope="user" />)

    const badge = screen.getByText('User')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('displays green badge for project scope', () => {
    mockUseUiStore.mockImplementation((selector) => {
      const state = {
        currentScope: 'project',
        setCurrentScope: mockSetCurrentScope,
      }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(<ProjectTab scope="project" project={mockProject} />)

    const badge = screen.getByText('Project')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })
})
