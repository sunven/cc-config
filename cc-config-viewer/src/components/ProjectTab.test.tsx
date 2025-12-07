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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with user scope and correct label', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'project',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="user" />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('用户级')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('renders with project scope and project name', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'user',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="project" project={mockProject} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('test-project')).toBeInTheDocument()
    expect(screen.getByText('Project')).toBeInTheDocument()
  })

  it('applies active styling when current scope matches', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'user',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="user" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies inactive styling when current scope does not match', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'project',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="user" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300')
  })

  it('calls setCurrentScope and updateConfigs when clicked', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'project',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="user" />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetCurrentScope).toHaveBeenCalledWith('user')
    expect(mockUpdateConfigs).toHaveBeenCalledTimes(1)
  })

  it('displays blue badge for user scope', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'user',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="user" />)

    const badge = screen.getByText('User')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('displays green badge for project scope', () => {
    const mockSetCurrentScope = vi.fn()
    const mockUpdateConfigs = vi.fn()

    mockUseUiStore.mockReturnValue({
      currentScope: 'project',
      setCurrentScope: mockSetCurrentScope,
      isLoading: false,
      sidebarOpen: true,
      theme: 'light',
      setLoading: vi.fn(),
      setSidebarOpen: vi.fn(),
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })

    mockUseConfigStore.mockReturnValue({
      configs: [],
      inheritanceChain: { entries: [], resolved: {} },
      updateConfigs: mockUpdateConfigs,
      updateConfig: vi.fn(),
      clearConfigs: vi.fn(),
    })

    render(<ProjectTab scope="project" project={mockProject} />)

    const badge = screen.getByText('Project')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })
})
