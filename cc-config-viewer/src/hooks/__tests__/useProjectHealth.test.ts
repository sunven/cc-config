import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectHealth } from '../useProjectHealth'
import { useProjectsStore } from '../../stores/projectsStore'

// Mock the store
vi.mock('../../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

const mockUseProjectsStore = vi.mocked(useProjectsStore)

describe('useProjectHealth', () => {
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
      updateProjectHealth: vi.fn().mockResolvedValue(undefined),
      refreshAllProjectHealth: vi.fn().mockResolvedValue(undefined),
    } as any)
  })

  it('returns projects and health metrics', () => {
    const { result } = renderHook(() => useProjectHealth())

    expect(result.current.projects).toEqual(mockProjects)
    expect(result.current.healthMetrics).toEqual(mockHealthMetrics)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('gets project health data', () => {
    const { result } = renderHook(() => useProjectHealth())

    const health = result.current.getProjectHealth('project-1')

    expect(health).not.toBeNull()
    expect(health?.projectId).toBe('project-1')
    expect(health?.status).toBe('good')
    expect(health?.score).toBe(95)
    expect(health?.metrics.totalCapabilities).toBe(10)
    expect(health?.metrics.validConfigs).toBe(10)
  })

  it('returns null for project without health data', () => {
    const { result } = renderHook(() => useProjectHealth())

    const health = result.current.getProjectHealth('non-existent-project')

    expect(health).toBeNull()
  })

  it('gets project health status', () => {
    const { result } = renderHook(() => useProjectHealth())

    expect(result.current.getProjectHealthStatus('project-1')).toBe('good')
    expect(result.current.getProjectHealthStatus('project-2')).toBe('warning')
    expect(result.current.getProjectHealthStatus('project-3')).toBe('unknown')
  })

  it('gets project health score', () => {
    const { result } = renderHook(() => useProjectHealth())

    expect(result.current.getProjectHealthScore('project-1')).toBe(95)
    expect(result.current.getProjectHealthScore('project-2')).toBe(65)
    expect(result.current.getProjectHealthScore('project-3')).toBe(0)
  })

  it('refreshes project health', async () => {
    const mockUpdateProjectHealth = vi.fn().mockResolvedValue(undefined)
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      updateProjectHealth: mockUpdateProjectHealth,
      refreshAllProjectHealth: vi.fn().mockResolvedValue(undefined),
    } as any)

    const { result } = renderHook(() => useProjectHealth())

    await act(async () => {
      await result.current.refreshProjectHealth('project-1')
    })

    expect(mockUpdateProjectHealth).toHaveBeenCalledWith('project-1')
  })

  it('refreshes all project health', async () => {
    const mockRefreshAllProjectHealth = vi.fn().mockResolvedValue(undefined)
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: mockHealthMetrics,
        isRefreshing: false,
      },
      updateProjectHealth: vi.fn().mockResolvedValue(undefined),
      refreshAllProjectHealth: mockRefreshAllProjectHealth,
    } as any)

    const { result } = renderHook(() => useProjectHealth())

    await act(async () => {
      await result.current.refreshAllHealth()
    })

    expect(mockRefreshAllProjectHealth).toHaveBeenCalled()
  })

  it('gets projects by health status', () => {
    const { result } = renderHook(() => useProjectHealth())

    const goodProjects = result.current.getProjectsByHealthStatus('good')
    const warningProjects = result.current.getProjectsByHealthStatus('warning')
    const errorProjects = result.current.getProjectsByHealthStatus('error')

    expect(goodProjects).toHaveLength(1)
    expect(goodProjects[0].id).toBe('project-1')

    expect(warningProjects).toHaveLength(1)
    expect(warningProjects[0].id).toBe('project-2')

    expect(errorProjects).toHaveLength(0)
  })

  it('calculates health statistics', () => {
    const { result } = renderHook(() => useProjectHealth())

    const stats = result.current.healthStatistics

    expect(stats.total).toBe(2)
    expect(stats.good).toBe(1)
    expect(stats.warning).toBe(1)
    expect(stats.error).toBe(0)
    expect(stats.averageScore).toBe(80) // (95 + 65) / 2 = 80
  })

  it('handles empty health metrics', () => {
    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      dashboard: {
        sortBy: 'health',
        filterBy: 'all',
        selectedProjects: [],
        healthMetrics: [],
        isRefreshing: false,
      },
      updateProjectHealth: vi.fn(),
      refreshAllProjectHealth: vi.fn(),
    } as any)

    const { result } = renderHook(() => useProjectHealth())

    const health = result.current.getProjectHealth('project-1')
    expect(health).toBeNull()

    const stats = result.current.healthStatistics
    expect(stats.total).toBe(2)
    expect(stats.averageScore).toBe(0)
  })
})
