import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectComparison } from './ProjectComparison'
import { useProjectsStore } from '../stores/projectsStore'

// Mock the stores
vi.mock('../stores/projectsStore', () => ({
  useProjectsStore: vi.fn(),
}))

const mockUseProjectsStore = useProjectsStore as vi.MockedFunction<typeof useProjectsStore>

describe('ProjectComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when not comparing', () => {
    mockUseProjectsStore.mockReturnValue({
      comparison: {
        leftProject: null,
        rightProject: null,
        isComparing: false,
        diffResults: [],
        comparisonMode: 'capabilities' as const,
      },
      clearComparison: vi.fn(),
      calculateDiff: vi.fn(),
    } as any)

    render(<ProjectComparison />)

    expect(screen.getByText('Select two projects to compare')).toBeInTheDocument()
  })

  it('renders comparison view when projects are set', () => {
    const mockLeftProject = {
      id: 'left-1',
      name: 'Left Project',
      path: '/left',
      configFileCount: 2,
      lastModified: new Date(),
      configSources: { user: false, project: true, local: false },
    }

    const mockRightProject = {
      id: 'right-1',
      name: 'Right Project',
      path: '/right',
      configFileCount: 3,
      lastModified: new Date(),
      configSources: { user: false, project: true, local: false },
    }

    mockUseProjectsStore.mockReturnValue({
      comparison: {
        leftProject: mockLeftProject,
        rightProject: mockRightProject,
        isComparing: true,
        diffResults: [
          {
            capabilityId: 'key1',
            status: 'match',
            severity: 'low',
            leftValue: { id: 'key1', key: 'key1', value: 'value1', source: 'left' },
            rightValue: { id: 'key1', key: 'key1', value: 'value1', source: 'right' },
          },
        ],
        comparisonMode: 'capabilities' as const,
      },
      clearComparison: vi.fn(),
      calculateDiff: vi.fn(),
    } as any)

    render(<ProjectComparison />)

    expect(screen.getByText('Project Comparison')).toBeInTheDocument()
    expect(screen.getByText('Exit Comparison')).toBeInTheDocument()
  })

  it('calls calculateDiff when projects are set', async () => {
    const mockCalculateDiff = vi.fn()
    const mockLeftProject = { id: 'left-1', name: 'Left Project', path: '/left', configFileCount: 1, lastModified: new Date(), configSources: { user: false, project: true, local: false } }
    const mockRightProject = { id: 'right-1', name: 'Right Project', path: '/right', configFileCount: 1, lastModified: new Date(), configSources: { user: false, project: true, local: false } }

    mockUseProjectsStore.mockReturnValue({
      comparison: {
        leftProject: mockLeftProject,
        rightProject: mockRightProject,
        isComparing: true,
        diffResults: [],
        comparisonMode: 'capabilities' as const,
      },
      clearComparison: vi.fn(),
      calculateDiff: mockCalculateDiff,
    } as any)

    render(<ProjectComparison />)

    expect(mockCalculateDiff).toHaveBeenCalled()
  })

  it('calls clearComparison when exit button is clicked', () => {
    const mockClearComparison = vi.fn()
    const mockLeftProject = { id: 'left-1', name: 'Left Project', path: '/left', configFileCount: 1, lastModified: new Date(), configSources: { user: false, project: true, local: false } }
    const mockRightProject = { id: 'right-1', name: 'Right Project', path: '/right', configFileCount: 1, lastModified: new Date(), configSources: { user: false, project: true, local: false } }

    mockUseProjectsStore.mockReturnValue({
      comparison: {
        leftProject: mockLeftProject,
        rightProject: mockRightProject,
        isComparing: true,
        diffResults: [],
        comparisonMode: 'capabilities' as const,
      },
      clearComparison: mockClearComparison,
      calculateDiff: vi.fn(),
    } as any)

    render(<ProjectComparison />)
    screen.getByText('Exit Comparison').click()

    expect(mockClearComparison).toHaveBeenCalled()
  })

  it('renders comparison summary when diffResults exist', () => {
    const mockLeftProject = { id: 'left-1', name: 'Left Project', path: '/left', configFileCount: 1, lastModified: new Date(), configSources: { user: false, project: true, local: false } }
    const mockRightProject = { id: 'right-1', name: 'Right Project', path: '/right', configFileCount: 1, lastModified: new Date(), configSources: { user: false, project: true, local: false } }

    mockUseProjectsStore.mockReturnValue({
      comparison: {
        leftProject: mockLeftProject,
        rightProject: mockRightProject,
        isComparing: true,
        diffResults: [
          {
            capabilityId: 'match1',
            status: 'match',
            severity: 'low',
            leftValue: { id: 'match1', key: 'match1', value: 'value1', source: 'left' },
            rightValue: { id: 'match1', key: 'match1', value: 'value1', source: 'right' },
          },
          {
            capabilityId: 'diff1',
            status: 'different',
            severity: 'medium',
            leftValue: { id: 'diff1', key: 'diff1', value: 'value1', source: 'left' },
            rightValue: { id: 'diff1', key: 'diff1', value: 'value2', source: 'right' },
          },
          {
            capabilityId: 'only-left',
            status: 'only-left',
            severity: 'medium',
            leftValue: { id: 'only-left', key: 'only-left', value: 'value1', source: 'left' },
          },
        ],
        comparisonMode: 'capabilities' as const,
        highlighting: {
          diffResults: [],
          filters: {
            showOnlyDifferences: false,
            showBlueOnly: true,
            showGreenOnly: true,
            showYellowOnly: true,
          },
          summary: {
            totalDifferences: 2,
            onlyInA: 1,
            onlyInB: 0,
            differentValues: 1,
          },
        },
      },
      clearComparison: vi.fn(),
      calculateDiff: vi.fn(),
      categorizeDifferences: vi.fn(),
      calculateSummaryStats: vi.fn(),
    } as any)

    render(<ProjectComparison />)

    // Verify comparison view is rendered with highlighting
    expect(screen.getByText('Project Comparison')).toBeInTheDocument()
    expect(screen.getByText('Left Project')).toBeInTheDocument()
    expect(screen.getByText('Right Project')).toBeInTheDocument()
  })
})