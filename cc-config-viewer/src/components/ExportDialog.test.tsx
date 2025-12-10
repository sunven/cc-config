import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportDialog } from './ExportDialog'
import { getDefaultExportOptions } from '../lib/exportService'
import type { ExportFormat } from '../types/export'

// Mock the export service
vi.mock('../lib/exportService', () => ({
  exportConfiguration: vi.fn(),
  createExportPreview: vi.fn(),
  getDefaultExportOptions: vi.fn(() => ({
    format: 'json',
    includeInherited: true,
    includeMCP: true,
    includeAgents: true,
    includeMetadata: true,
  })),
}))

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

const mockComparison = {
  leftProject: mockProject,
  rightProject: { ...mockProject, id: '2', name: 'test-project-2' },
  diffResults: [
    {
      capabilityId: 'cap1',
      status: 'different' as const,
      severity: 'high' as const,
      leftValue: { id: '1', key: 'key1', value: 'value1', source: 'project1' },
      rightValue: { id: '2', key: 'key1', value: 'value2', source: 'project2' },
    },
  ],
}

describe('ExportDialog', () => {
  it('should render with project data', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    expect(screen.getByText('导出配置')).toBeInTheDocument()
    expect(screen.getByText('test-project')).toBeInTheDocument()
    expect(screen.getByText('项目配置')).toBeInTheDocument()
  })

  it('should render with comparison data', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="comparison"
        data={mockComparison}
      />
    )

    expect(screen.getByText('导出配置')).toBeInTheDocument()
    expect(screen.getByText('test-project vs test-project-2')).toBeInTheDocument()
    expect(screen.getByText('比较结果')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(
      <ExportDialog
        open={false}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    expect(screen.queryByText('导出配置')).not.toBeInTheDocument()
  })

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <ExportDialog
        open={true}
        onOpenChange={onOpenChange}
        source="project"
        data={mockProject}
      />
    )

    await user.click(screen.getByText('取消'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should handle format selection', async () => {
    const user = userEvent.setup()
    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    // Find and click the Markdown option
    const markdownOption = screen.getByText('Markdown').closest('[role="radio"]') as HTMLElement
    await user.click(markdownOption)

    // Verify that the format selection changed (this would require state inspection in a real test)
    expect(markdownOption).toHaveAttribute('data-state', 'checked')
  })

  it('should handle export options changes', async () => {
    const user = userEvent.setup()
    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    // Find and click the MCP checkbox
    const mcpCheckbox = screen.getByLabelText('包含MCP服务器')
    await user.click(mcpCheckbox)

    // Verify checkbox state changed
    expect(mcpCheckbox).not.toBeChecked()
  })

  it('should show export preview when data is available', () => {
    const { createExportPreview } = vi.mocked(require('../lib/exportService'))
    createExportPreview.mockReturnValue({
      format: 'json' as ExportFormat,
      content: '{ "test": "data" }',
      recordCount: 1,
      estimatedSize: 1024,
      options: getDefaultExportOptions(),
    })

    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    expect(screen.getByText('内容预览')).toBeInTheDocument()
  })

  it('should handle clipboard export', async () => {
    const user = userEvent.setup()
    const { exportConfiguration } = vi.mocked(require('../lib/exportService'))
    exportConfiguration.mockResolvedValue({
      success: true,
      content: '{ "test": "data" }',
      format: 'json',
    })

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })

    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    await user.click(screen.getByText('复制到剪贴板'))

    await waitFor(() => {
      expect(screen.getByText('导出成功！')).toBeInTheDocument()
    })
  })

  it('should handle export errors', async () => {
    const user = userEvent.setup()
    const { exportConfiguration } = vi.mocked(require('../lib/exportService'))
    exportConfiguration.mockRejectedValue(new Error('Export failed'))

    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    await user.click(screen.getByText('复制到剪贴板'))

    await waitFor(() => {
      expect(screen.getByText(/Export failed/)).toBeInTheDocument()
    })
  })

  it('should disable export buttons when exporting', async () => {
    const user = userEvent.setup()
    const { exportConfiguration } = vi.mocked(require('../lib/exportService'))
    // Make export take some time
    exportConfiguration.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        success: true,
        content: '{ "test": "data" }',
        format: 'json',
      }), 100))
    )

    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    await user.click(screen.getByText('复制到剪贴板'))

    // Check that buttons are disabled during export
    expect(screen.getByText('复制到剪贴板')).toBeDisabled()
    expect(screen.getByText('下载文件')).toBeDisabled()
  })

  it('should show record count and file size', () => {
    const { createExportPreview } = vi.mocked(require('../lib/exportService'))
    createExportPreview.mockReturnValue({
      format: 'json' as ExportFormat,
      content: '{ "test": "data" }',
      recordCount: 5,
      estimatedSize: 2048,
      options: getDefaultExportOptions(),
    })

    render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    expect(screen.getByText('5 条记录')).toBeInTheDocument()
    expect(screen.getByText('预计大小: 2.0 KB')).toBeInTheDocument()
  })

  it('should reset state when dialog is reopened', () => {
    const { exportConfiguration } = vi.mocked(require('../lib/exportService'))
    exportConfiguration.mockResolvedValue({
      success: true,
      content: '{ "test": "data" }',
      format: 'json',
    })

    const { rerender } = render(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    // Trigger export
    fireEvent.click(screen.getByText('复制到剪贴board'))

    // Verify success message appears
    expect(screen.getByText('导出成功！')).toBeInTheDocument()

    // Close dialog
    rerender(
      <ExportDialog
        open={false}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    // Reopen dialog
    rerender(
      <ExportDialog
        open={true}
        onOpenChange={vi.fn()}
        source="project"
        data={mockProject}
      />
    )

    // Verify state is reset
    expect(screen.queryByText('导出成功！')).not.toBeInTheDocument()
  })
})
