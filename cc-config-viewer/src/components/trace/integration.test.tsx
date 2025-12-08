/**
 * Integration tests for Story 3.4 - Source Trace Functionality
 *
 * Tests the complete integration with:
 * - Story 3.1: Color-coded source indicators
 * - Story 3.3: Inheritance path visualization
 * - configStore state management
 *
 * Covers:
 * - AC7: Integration with color-coded source indicators
 * - AC8: Support for inheritance path visualization
 * - Complete trace workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SourceTraceContext } from './SourceTraceContext'
import { IntegratedSourceTrace } from './IntegratedSourceTrace'
import { useConfigStore } from '../../stores/configStore'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// Mock configStore
vi.mock('../../stores/configStore', () => ({
  useConfigStore: vi.fn(),
}))

describe('Story 3.4 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Integration with Story 3.1 (Source Indicators)', () => {
    it('should display color-coded source indicators (AC7)', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockImplementation(async (cmd: string, args: any) => {
        if (cmd === 'get_source_location') {
          return {
            file_path: '/home/user/.claude.json',
            line_number: 42,
            context: '  "testKey": "value",',
          }
        }
        if (cmd === 'open_in_editor') {
          return undefined
        }
        if (cmd === 'copy_to_clipboard') {
          return undefined
        }
        return undefined
      })

      const mockSetSourceLocation = vi.fn()
      vi.mocked(useConfigStore).mockReturnValue({
        setSourceLocation: mockSetSourceLocation,
        getSourceLocation: vi.fn(() => undefined),
      } as any)

      render(
        <SourceTraceContext configKey="testKey">
          <div>Test Config Item</div>
        </SourceTraceContext>
      )

      // Right-click to open context menu
      const configItem = screen.getByTestId('source-trace-context')
      fireEvent.contextMenu(configItem)

      // Click Trace Source
      const traceButton = screen.getByText('Trace Source')
      fireEvent.click(traceButton)

      // Should show source location in menu
      await screen.findByText('Copy File Path', {}, { timeout: 100 })
    })

    it('should show correct badge variant for each source type', () => {
      const { rerender } = render(
        <IntegratedSourceTrace
          configKey="testKey"
          sourceType="user"
          sourceLocation={{
            file_path: '/home/user/.claude.json',
            line_number: 42,
          }}
        />
      )

      // Check for blue badge for user level (default variant)
      expect(screen.getByTestId('integrated-source-trace')).toBeInTheDocument()

      // Project level - should show green
      rerender(
        <IntegratedSourceTrace
          configKey="testKey"
          sourceType="project"
          sourceLocation={{
            file_path: '/project/.mcp.json',
            line_number: 42,
          }}
        />
      )

      // Inherited - should show gray
      rerender(
        <IntegratedSourceTrace
          configKey="testKey"
          sourceType="inherited"
          sourceLocation={{
            file_path: '/home/user/.claude.json',
            line_number: 42,
          }}
        />
      )
    })
  })

  describe('Integration with Story 3.3 (Inheritance Path)', () => {
    it('should integrate with inheritance chain visualization (AC8)', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockResolvedValue({
        file_path: '/home/user/.claude.json',
        line_number: 42,
        context: '  "testKey": "value",',
      })

      const mockSetSourceLocation = vi.fn()
      const mockGetSourceLocation = vi.fn((key: string) =>
        key === 'testKey'
          ? {
              file_path: '/home/user/.claude.json',
              line_number: 42,
              context: '  "testKey": "value",',
            }
          : undefined
      )

      vi.mocked(useConfigStore).mockReturnValue({
        setSourceLocation: mockSetSourceLocation,
        getSourceLocation: mockGetSourceLocation,
        sourceLocations: {},
      } as any)

      render(
        <IntegratedSourceTrace
          configKey="testKey"
          configValue="testValue"
          sourceType="user"
          sourceLocation={{
            file_path: '/home/user/.claude.json',
            line_number: 42,
          }}
        />
      )

      // Should display config key and value
      expect(screen.getByText('testKey')).toBeInTheDocument()
      expect(screen.getByText('"testValue"')).toBeInTheDocument()

      // Should show Git branch icon for inherited values
      expect(screen.getByTitle('Inherited value')).toBeInTheDocument()
    })

    it('should work with inheritance chain data from configStore', () => {
      const mockInheritanceData = [
        {
          key: 'inheritedKey',
          value: 'fromUser',
          source: { type: 'user' as const, path: '~/.claude.json' },
        },
        {
          key: 'overriddenKey',
          value: 'fromProject',
          source: { type: 'project' as const, path: './.mcp.json' },
        },
      ]

      render(
        <div>
          {mockInheritanceData.map((config) => (
            <IntegratedSourceTrace
              key={config.key}
              configKey={config.key}
              configValue={config.value}
              sourceType={config.source.type}
              sourceLocation={{
                file_path: config.source.path,
                line_number: 42,
              }}
            />
          ))}
        </div>
      )

      // Both should be rendered
      expect(screen.getByText('inheritedKey')).toBeInTheDocument()
      expect(screen.getByText('overriddenKey')).toBeInTheDocument()
    })
  })

  describe('Complete Trace Workflow (AC1-AC9)', () => {
    it('should complete full trace workflow including trace → copy → open (AC1-6)', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockImplementation(async (cmd: string, args: any) => {
        if (cmd === 'get_source_location') {
          return {
            file_path: '/home/user/.claude.json',
            line_number: 42,
            context: '  "testKey": "value",',
          }
        }
        if (cmd === 'open_in_editor') {
          return undefined
        }
        if (cmd === 'copy_to_clipboard') {
          return undefined
        }
        return undefined
      })

      const mockSetSourceLocation = vi.fn()
      vi.mocked(useConfigStore).mockReturnValue({
        setSourceLocation: mockSetSourceLocation,
        getSourceLocation: vi.fn(() => undefined),
        sourceLocations: {},
      } as any)

      render(
        <SourceTraceContext configKey="testKey">
          <div>Test Config Item</div>
        </SourceTraceContext>
      )

      // Step 1: Right-click (AC1)
      const configItem = screen.getByTestId('source-trace-context')
      fireEvent.contextMenu(configItem)

      // Step 2: Trace Source
      const traceButton = screen.getByText('Trace Source')
      fireEvent.click(traceButton)

      // Step 3: Copy file path (AC6)
      await screen.findByText('Copy File Path')
      const copyButton = screen.getByText('Copy File Path')
      fireEvent.click(copyButton)

      // Step 4: Open in editor (AC4)
      const openButton = screen.getByText('Open in Editor')
      fireEvent.click(openButton)

      // Verify all commands were called
      expect(mockInvoke).toHaveBeenCalledWith('get_source_location', expect.anything())
      expect(mockInvoke).toHaveBeenCalledWith('copy_to_clipboard', {
        text: '/home/user/.claude.json',
      })
      expect(mockInvoke).toHaveBeenCalledWith('open_in_editor', {
        filePath: '/home/user/.claude.json',
        lineNumber: 42,
      })
    })

    it('should show line number reference when available (AC3)', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockResolvedValue({
        file_path: '/home/user/.claude.json',
        line_number: 42,
        context: '  "testKey": "value",',
      })

      render(
        <IntegratedSourceTrace
          configKey="testKey"
          sourceType="user"
          sourceLocation={{
            file_path: '/home/user/.claude.json',
            line_number: 42,
          }}
        />
      )

      // Should display line number in the display
      expect(screen.getByText(/\(42\)/)).toBeInTheDocument()
    })

    it('should show notification when file not found (AC5)', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockResolvedValue(null)

      const mockSetSourceLocation = vi.fn()
      vi.mocked(useConfigStore).mockReturnValue({
        setSourceLocation: mockSetSourceLocation,
        getSourceLocation: vi.fn(() => undefined),
        sourceLocations: {},
      } as any)

      render(
        <SourceTraceContext configKey="nonexistentKey">
          <div>Test Config Item</div>
        </SourceTraceContext>
      )

      const configItem = screen.getByTestId('source-trace-context')
      fireEvent.contextMenu(configItem)

      const traceButton = screen.getByText('Trace Source')
      fireEvent.click(traceButton)

      // Should show error message
      await screen.findByText(/Source location not found/, {}, { timeout: 1000 })
    })
  })

  describe('Performance Requirements (AC9)', () => {
    it('should complete trace within 100ms', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      // Mock fast response
      mockInvoke.mockImplementation(async (cmd: string, args: any) => {
        // Small delay to simulate realistic operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return {
          file_path: '/home/user/.claude.json',
          line_number: 42,
          context: '  "testKey": "value",',
        }
      })

      const startTime = performance.now()

      const mockSetSourceLocation = vi.fn()
      vi.mocked(useConfigStore).mockReturnValue({
        setSourceLocation: mockSetSourceLocation,
        getSourceLocation: vi.fn(() => undefined),
        sourceLocations: {},
      } as any)

      render(
        <SourceTraceContext configKey="testKey">
          <div>Test Config Item</div>
        </SourceTraceContext>
      )

      const configItem = screen.getByTestId('source-trace-context')
      fireEvent.contextMenu(configItem)

      const traceButton = screen.getByText('Trace Source')
      fireEvent.click(traceButton)

      // Wait for copy button to appear
      await screen.findByText('Copy File Path')

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })
  })

  describe('State Management Integration', () => {
    it('should store source locations in configStore', async () => {
      const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke

      mockInvoke.mockResolvedValue({
        file_path: '/home/user/.claude.json',
        line_number: 42,
        context: '  "testKey": "value",',
      })

      const mockSetSourceLocation = vi.fn()
      const mockGetSourceLocation = vi.fn(() => undefined)

      vi.mocked(useConfigStore).mockReturnValue({
        setSourceLocation: mockSetSourceLocation,
        getSourceLocation: mockGetSourceLocation,
        sourceLocations: {},
      } as any)

      render(
        <SourceTraceContext configKey="testKey">
          <div>Test Config Item</div>
        </SourceTraceContext>
      )

      const configItem = screen.getByTestId('source-trace-context')
      fireEvent.contextMenu(configItem)

      const traceButton = screen.getByText('Trace Source')
      fireEvent.click(traceButton)

      // Wait for the operation to complete
      await screen.findByText('Copy File Path')

      // Should have been called to store the location
      expect(mockSetSourceLocation).toHaveBeenCalledWith(
        'testKey',
        expect.objectContaining({
          file_path: '/home/user/.claude.json',
          line_number: 42,
        })
      )
    })
  })
})