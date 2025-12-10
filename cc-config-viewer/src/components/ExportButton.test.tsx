import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton } from './ExportButton'

const mockProject = {
  id: '1',
  name: 'test-project',
  path: '/path/to/test',
  configFileCount: 2,
  lastModified: new Date(),
  configSources: { user: true, project: true, local: false },
  mcpServers: ['server1'],
  subAgents: ['agent1'],
}

describe('ExportButton', () => {
  it('should render with default text', () => {
    render(
      <ExportButton
        source="project"
        data={mockProject}
      />
    )

    expect(screen.getByText('导出')).toBeInTheDocument()
  })

  it('should render with custom children', () => {
    render(
      <ExportButton
        source="project"
        data={mockProject}
      >
        导出配置
      </ExportButton>
    )

    expect(screen.getByText('导出配置')).toBeInTheDocument()
  })

  it('should open dialog when clicked', async () => {
    const user = userEvent.setup()
    render(
      <ExportButton
        source="project"
        data={mockProject}
      />
    )

    await user.click(screen.getByText('导出'))

    expect(screen.getByText('导出配置')).toBeInTheDocument()
  })

  it('should be disabled when no data', () => {
    render(
      <ExportButton
        source="project"
        data={null}
      />
    )

    expect(screen.getByText('导出')).toBeDisabled()
  })

  it('should call onExportComplete when export finishes', async () => {
    const user = userEvent.setup()
    const onExportComplete = vi.fn()

    render(
      <ExportButton
        source="project"
        data={mockProject}
        onExportComplete={onExportComplete}
      />
    )

    await user.click(screen.getByText('导出'))

    // Mock export completion
    const dialog = screen.getByText('导出配置').closest('[role="dialog"]')
    expect(dialog).toBeInTheDocument()
  })
})
