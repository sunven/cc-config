import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardFilters } from '../useDashboardFilters'
import { useProjectsStore } from '../../stores/projectsStore'

// Mock the store
vi.mock('../../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

const mockUseProjectsStore = vi.mocked(useProjectsStore)

describe('useDashboardFilters', () => {
  const mockProjects = [
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
    {
      id: 'project-3',
      name: 'Project Gamma',
      path: '/path/to/gamma',
      configFileCount: 12,
      lastModified: Math.floor(Date.now() / 1000) - 1000,
      configSources: { user: false, project: true, local: false },
    },
  ]

  const mockHealthMetrics = [
    {
      projectId: 'project-1',
      totalCapabilities: 10,
      validConfigs: 10,
      invalidConfigs: 0,
      warningCount: 0,
      errorCount: 0,
      lastModified: '2024-01-01',
      healthScore: 95,
    },
    {
      projectId: 'project-2',
      totalCapabilities: 10,
      validConfigs: 8,
      invalidConfigs: 2,
      warningCount: 3,
      errorCount: 1,
      lastModified: '2024-01-01',
      healthScore: 65,
    },
    {
      projectId: 'project-3',
      totalCapabilities: 10,
      validConfigs: 5,
      invalidConfigs: 5,
      warningCount: 8,
      errorCount: 3,
      lastModified: '2024-01-01',
      healthScore: 35,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: vi.fn(),
    } as any)
  })

  it('returns current sort and filter state', () => {
    const { result } = renderHook(() => useDashboardFilters())

    expect(result.current.sortBy).toBe('health')
    expect(result.current.filterBy).toBe('all')
  })

  it('filters projects by health status', () => {
    const { result } = renderHook(() => useDashboardFilters())

    // With filterBy='all', all projects should be returned
    expect(result.current.filteredAndSortedProjects).toHaveLength(3)
  })

  it('changes filter', () => {
    const mockSetDashboardFilters = vi.fn()
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: mockSetDashboardFilters,
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    act(() => {
      result.current.changeFilter('good')
    })

    expect(mockSetDashboardFilters).toHaveBeenCalledWith({ filterBy: 'good' })
  })

  it('changes sort', () => {
    const mockSetDashboardFilters = vi.fn()
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: mockSetDashboardFilters,
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    act(() => {
      result.current.changeSort('name')
    })

    expect(mockSetDashboardFilters).toHaveBeenCalledWith({ sortBy: 'name' })
  })

  it('toggles filter through all options', () => {
    const mockSetDashboardFilters = vi.fn()
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: mockSetDashboardFilters,
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    act(() => {
      result.current.toggleFilter()
    })
    expect(mockSetDashboardFilters).toHaveBeenCalledWith({ filterBy: 'good' })
  })

  it('toggles sort through all options', () => {
    const mockSetDashboardFilters = vi.fn()
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: mockSetDashboardFilters,
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    act(() => {
      result.current.toggleSort()
    })
    expect(mockSetDashboardFilters).toHaveBeenCalledWith({ sortBy: 'name' })
  })

  it('gets filter count', () => {
    const { result } = renderHook(() => useDashboardFilters())

    expect(result.current.filterCount).toBe(3)
  })

  it('gets sort info', () => {
    const { result } = renderHook(() => useDashboardFilters())

    const info = result.current.sortInfo

    expect(info.sortBy).toBe('health')
    expect(info.filterBy).toBe('all')
    expect(info.isSortedByHealth).toBe(true)
    expect(info.isSortedByName).toBe(false)
    expect(info.isSortedByLastAccessed).toBe(false)
    expect(info.isFiltered).toBe(false)
    expect(info.isFilteredByGood).toBe(false)
    expect(info.isFilteredByWarning).toBe(false)
    expect(info.isFilteredByError).toBe(false)
  })

  it('filters projects correctly with different filters', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'good',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: vi.fn(),
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    // With 'good' filter, only project-1 should be visible
    expect(result.current.filteredAndSortedProjects).toHaveLength(1)
    expect(result.current.filteredAndSortedProjects[0].id).toBe('project-1')
  })

  it('sorts projects by health score', () => {
    const { result } = renderHook(() => useDashboardFilters())

    // Projects should be sorted by health score (95, 65, 35)
    expect(result.current.filteredAndSortedProjects[0].id).toBe('project-1')
    expect(result.current.filteredAndSortedProjects[1].id).toBe('project-2')
    expect(result.current.filteredAndSortedProjects[2].id).toBe('project-3')
  })

  it('sorts projects by name', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'name',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      setDashboardFilters: vi.fn(),
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    // Projects should be sorted alphabetically
    expect(result.current.filteredAndSortedProjects[0].name).toBe('Project Alpha')
    expect(result.current.filteredAndSortedProjects[1].name).toBe('Project Beta')
    expect(result.current.filteredAndSortedProjects[2].name).toBe('Project Gamma')
  })

  it('handles missing health metrics gracefully', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: [],
        isRefreshing: false,
      },
      setDashboardFilters: vi.fn(),
    } as any)

    const { result } = renderHook(() => useDashboardFilters())

    // Should still return all projects, but sorted by health score (all 0)
    expect(result.current.filteredAndSortedProjects).toHaveLength(3)
  })
})
