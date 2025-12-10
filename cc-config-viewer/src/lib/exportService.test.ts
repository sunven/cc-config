import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  exportConfiguration,
  createExportPreview,
  isValidExportFormat,
  getDefaultExportOptions,
  sanitizeFilename,
  generateExportFilename,
} from './exportService'
import type { ExportFormat, ExportOptions } from '../types/export'
import type { DiscoveredProject } from '../types/project'
import type { DiffResult } from '../types/comparison'

// Mock performance.now
vi.stubGlobal('performance', {
  now: vi.fn(() => 100),
})

describe('ExportService', () => {
  const mockProject: DiscoveredProject = {
    id: '1',
    name: 'test-project',
    path: '/path/to/test-project',
    configFileCount: 2,
    lastModified: new Date(),
    configSources: {
      user: true,
      project: true,
      local: false,
    },
    mcpServers: ['server1', 'server2'],
    subAgents: ['agent1'],
  }

  const mockComparison = {
    leftProject: mockProject,
    rightProject: {
      ...mockProject,
      id: '2',
      name: 'test-project-2',
      path: '/path/to/test-project-2',
    },
    diffResults: [
      {
        capabilityId: 'cap1',
        status: 'different' as const,
        severity: 'high' as const,
        leftValue: { id: '1', key: 'key1', value: 'value1', source: 'project1' },
        rightValue: { id: '2', key: 'key1', value: 'value2', source: 'project2' },
      },
    ],
    metadata: {
      version: '1.0',
      exportFormat: 'json' as const,
      timestamp: new Date().toISOString(),
      sourceType: 'comparison' as const,
      recordCount: 1,
      fileSize: 1024,
      includeInherited: true,
      includeMCP: true,
      includeAgents: true,
    },
  }

  const defaultOptions: ExportOptions = {
    format: 'json',
    includeInherited: true,
    includeMCP: true,
    includeAgents: true,
    includeMetadata: true,
  }

  describe('exportConfiguration', () => {
    it('should export project as JSON', async () => {
      const result = await exportConfiguration('project', mockProject, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.format).toBe('json')
      expect(result.content).toBeDefined()
      expect(result.content).toContain('test-project')
      expect(result.stats).toBeDefined()
      expect(result.stats?.recordCount).toBeGreaterThan(0)
    })

    it('should export project as Markdown', async () => {
      const options = { ...defaultOptions, format: 'markdown' as const }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      expect(result.format).toBe('markdown')
      expect(result.content).toContain('# Configuration Export')
      expect(result.content).toContain('test-project')
    })

    it('should export project as CSV', async () => {
      const options = { ...defaultOptions, format: 'csv' as const }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      expect(result.format).toBe('csv')
      expect(result.content).toContain('Type,Name,Source,Configuration')
      expect(result.content).toContain('MCP')
    })

    it('should export comparison data', async () => {
      const result = await exportConfiguration('comparison', mockComparison, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.format).toBe('json')
      expect(result.content).toContain('comparison')
      expect(result.content).toContain('test-project')
    })

    it('should handle invalid export format', async () => {
      const options = { ...defaultOptions, format: 'pdf' as any }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('export')
    })

    it('should handle missing project data', async () => {
      const result = await exportConfiguration('project', null as any, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('validation')
    })

    it('should track export statistics', async () => {
      const result = await exportConfiguration('project', mockProject, defaultOptions)

      expect(result.stats).toBeDefined()
      expect(result.stats?.recordCount).toBeGreaterThanOrEqual(0)
      expect(result.stats?.fileSize).toBeGreaterThanOrEqual(0)
      expect(result.stats?.duration).toBeGreaterThanOrEqual(0)
    })

    it('should measure export duration', async () => {
      const result = await exportConfiguration('project', mockProject, defaultOptions)

      expect(result.stats?.duration).toBeGreaterThan(0)
      expect(result.stats?.duration).toBeLessThan(1000)
    })
  })

  describe('createExportPreview', () => {
    it('should create JSON preview', () => {
      const preview = createExportPreview('project', mockProject, defaultOptions)

      expect(preview.format).toBe('json')
      expect(preview.content).toBeDefined()
      expect(preview.recordCount).toBeGreaterThanOrEqual(0)
      expect(preview.estimatedSize).toBeGreaterThanOrEqual(0)
      expect(preview.options).toEqual(defaultOptions)
    })

    it('should create Markdown preview', () => {
      const options = { ...defaultOptions, format: 'markdown' as const }
      const preview = createExportPreview('project', mockProject, options)

      expect(preview.format).toBe('markdown')
      expect(preview.content).toContain('# Configuration Export')
    })

    it('should create CSV preview', () => {
      const options = { ...defaultOptions, format: 'csv' as const }
      const preview = createExportPreview('project', mockProject, options)

      expect(preview.format).toBe('csv')
      expect(preview.content).toContain('Type,Name,Source,Configuration')
    })

    it('should create preview for comparison data', () => {
      const preview = createExportPreview('comparison', mockComparison, defaultOptions)

      expect(preview.format).toBe('json')
      expect(preview.recordCount).toBe(1)
    })

    it('should calculate estimated size', () => {
      const preview = createExportPreview('project', mockProject, defaultOptions)

      expect(preview.estimatedSize).toBeGreaterThan(0)
      expect(typeof preview.estimatedSize).toBe('number')
    })
  })

  describe('isValidExportFormat', () => {
    it('should validate JSON format', () => {
      expect(isValidExportFormat('json')).toBe(true)
    })

    it('should validate Markdown format', () => {
      expect(isValidExportFormat('markdown')).toBe(true)
    })

    it('should validate CSV format', () => {
      expect(isValidExportFormat('csv')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidExportFormat('pdf')).toBe(false)
      expect(isValidExportFormat('xml')).toBe(false)
      expect(isValidExportFormat('')).toBe(false)
    })
  })

  describe('getDefaultExportOptions', () => {
    it('should return default export options', () => {
      const options = getDefaultExportOptions()

      expect(options.format).toBe('json')
      expect(options.includeInherited).toBe(true)
      expect(options.includeMCP).toBe(true)
      expect(options.includeAgents).toBe(true)
      expect(options.includeMetadata).toBe(true)
    })
  })

  describe('sanitizeFilename', () => {
    it('should sanitize filename with special characters', () => {
      const result = sanitizeFilename('test/project<>:"name.json')
      expect(result).toBe('test_project___name.json')
    })

    it('should convert to lowercase', () => {
      const result = sanitizeFilename('TestProject')
      expect(result).toBe('testproject')
    })

    it('should replace spaces with hyphens', () => {
      const result = sanitizeFilename('Test Project Name')
      expect(result).toBe('test })

    it('-project-name')
   should limit length', () => {
      const longName = 'a'.repeat(150)
      const result = sanitizeFilename(longName)
      expect(result.length).toBe(100)
    })

    it('should handle empty string', () => {
      const result = sanitizeFilename('')
      expect(result).toBe('')
    })
  })

  describe('generateExportFilename', () => {
    it('should generate filename for JSON format', () => {
      const filename = generateExportFilename('test-project', 'json')
      expect(filename).toMatch(/^test-project-config-\d{4}-\d{2}-\d{2}\.json$/)
    })

    it('should generate filename for Markdown format', () => {
      const filename = generateExportFilename('test-project', 'markdown')
      expect(filename).toMatch(/^test-project-config-\d{4}-\d{2}-\d{2}\.markdown$/)
    })

    it('should generate filename for CSV format', () => {
      const filename = generateExportFilename('test-project', 'csv')
      expect(filename).toMatch(/^test-project-config-\d{4}-\d{2}-\d{2}\.csv$/)
    })

    it('should use custom timestamp', () => {
      const customDate = new Date('2024-01-01')
      const filename = generateExportFilename('test-project', 'json', customDate)
      expect(filename).toBe('test-project-config-2024-01-01.json')
    })

    it('should handle project names with special characters', () => {
      const filename = generateExportFilename('Test/Project<>', 'json')
      expect(filename).toMatch(/^test_project___-config-\d{4}-\d{2}-\d{2}\.json$/)
    })
  })

  describe('Error Handling', () => {
    it('should handle export failures gracefully', async () => {
      // Mock a failing scenario
      const invalidProject = { ...mockProject, name: '' }
      const result = await exportConfiguration('project', invalidProject, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.type).toBe('validation')
    })

    it('should include error details', async () => {
      const result = await exportConfiguration('project', null as any, defaultOptions)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBeDefined()
    })

    it('should return partial stats on failure', async () => {
      const result = await exportConfiguration('project', null as any, defaultOptions)

      expect(result.stats).toBeDefined()
      expect(result.stats?.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance', () => {
    it('should complete export within reasonable time', async () => {
      const start = performance.now()
      await exportConfiguration('project', mockProject, defaultOptions)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should track duration accurately', async () => {
      const result = await exportConfiguration('project', mockProject, defaultOptions)

      expect(result.stats?.duration).toBeGreaterThanOrEqual(0)
      expect(result.stats?.duration).toBeLessThan(100)
    })
  })

  describe('Content Validation', () => {
    it('should generate valid JSON content', async () => {
      const result = await exportConfiguration('project', mockProject, defaultOptions)

      expect(result.success).toBe(true)
      expect(() => JSON.parse(result.content!)).not.toThrow()
    })

    it('should generate valid CSV content', async () => {
      const options = { ...defaultOptions, format: 'csv' as const }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      expect(result.content).toContain('Type,Name,Source,Configuration')
    })

    it('should generate human-readable Markdown', async () => {
      const options = { ...defaultOptions, format: 'markdown' as const }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      expect(result.content).toContain('# Configuration Export')
      expect(result.content).toContain('**Project:**')
    })
  })

  describe('Data Filtering', () => {
    it('should filter out MCP if not included', async () => {
      const options = { ...defaultOptions, includeMCP: false }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      // Content should not include MCP data
      expect(result.content).not.toContain('MCP')
    })

    it('should filter out Agents if not included', async () => {
      const options = { ...defaultOptions, includeAgents: false }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      // Content should not include agent data
      expect(result.content).not.toContain('Agent')
    })

    it('should filter out inherited configs if not included', async () => {
      const options = { ...defaultOptions, includeInherited: false }
      const result = await exportConfiguration('project', mockProject, options)

      expect(result.success).toBe(true)
      // Content should not include inherited data
      expect(result.content).not.toContain('Inherited')
    })
  })
})
