import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectComparison } from './useProjectComparison'

// Mock the projects store
const mockStore = {
  comparison: {
    leftProject: null,
    rightProject: null,
    isComparing: false,
    diffResults: [],
    comparisonMode: 'capabilities' as const,
  },
  setComparisonProjects: vi.fn(),
  calculateDiff: vi.fn(),
  clearComparison: vi.fn(),
}

vi.mock('../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(() => mockStore),
}))

describe('useProjectComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.setComparisonProjects.mockClear()
    mockStore.calculateDiff.mockClear()
    mockStore.clearComparison.mockClear()
  })

  it('returns initial comparison state', () => {
    const { result } = renderHook(() => useProjectComparison())

    expect(result.current.leftProject).toBeNull()
    expect(result.current.rightProject).toBeNull()
    expect(result.current.isComparing).toBe(false)
    expect(result.current.diffResults).toEqual([])
    expect(result.current.comparisonMode).toBe('capabilities')
  })

  it('starts comparison with two projects', () => {
    const { result } = renderHook(() => useProjectComparison())

    const leftProject = { id: 'left', name: 'Left Project' } as any
    const rightProject = { id: 'right', name: 'Right Project' } as any

    act(() => {
      result.current.startComparison(leftProject, rightProject)
    })

    expect(mockStore.setComparisonProjects).toHaveBeenCalledWith(leftProject, rightProject)
  })

  it('refreshes comparison', async () => {
    const { result } = renderHook(() => useProjectComparison())

    await act(async () => {
      await result.current.refreshComparison()
    })

    expect(mockStore.calculateDiff).toHaveBeenCalled()
  })

  it('exits comparison', () => {
    const { result } = renderHook(() => useProjectComparison())

    act(() => {
      result.current.exitComparison()
    })

    expect(mockStore.clearComparison).toHaveBeenCalled()
  })
})