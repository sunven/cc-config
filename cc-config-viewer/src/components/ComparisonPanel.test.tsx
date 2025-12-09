import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComparisonPanel } from './ComparisonPanel'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'

describe('ComparisonPanel', () => {
  const mockProject: DiscoveredProject = {
    id: 'project-1',
    name: 'Test Project',
    path: '/test/project',
    configFileCount: 2,
    lastModified: new Date(),
    configSources: { user: false, project: true, local: false },
  }

  const mockDiffResults: DiffResult[] = [
    {
      capabilityId: 'key1',
      status: 'match',
      severity: 'low',
      leftValue: { id: 'key1', key: 'key1', value: 'value1', source: 'project' },
      rightValue: { id: 'key1', key: 'key1', value: 'value1', source: 'project' },
    },
    {
      capabilityId: 'key2',
      status: 'different',
      severity: 'medium',
      leftValue: { id: 'key2', key: 'key2', value: 'value1', source: 'project' },
      rightValue: { id: 'key2', key: 'key2', value: 'value2', source: 'project' },
    },
  ]

  beforeEach(() => {
    // Mock ScrollArea component
    vi.mock('./ui/scroll-area', () => ({
      ScrollArea: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="scroll-area">{children}</div>
      ),
    }))
  })

  it('renders project name and config file count', () => {
    render(<ComparisonPanel project={mockProject} diffResults={[]} side="left" />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('2 config files')).toBeInTheDocument()
  })

  it('renders right side badge for right panel', () => {
    render(<ComparisonPanel project={mockProject} diffResults={[]} side="right" />)

    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('renders diff results', () => {
    render(<ComparisonPanel project={mockProject} diffResults={mockDiffResults} side="left" />)

    // Should render card content for both diff results
    expect(screen.getByText('key1')).toBeInTheDocument()
    expect(screen.getByText('key2')).toBeInTheDocument()
  })

  it('renders empty state when no diff results', () => {
    render(<ComparisonPanel project={mockProject} diffResults={[]} side="left" />)

    expect(screen.getByText('No capabilities to display')).toBeInTheDocument()
  })

  it('applies correct className prop', () => {
    const { container } = render(
      <ComparisonPanel
        project={mockProject}
        diffResults={mockDiffResults}
        side="left"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})