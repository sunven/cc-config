import { describe, it, expect } from 'vitest'
import type {
  ExportFormat,
  ExportOptions,
  ExportData,
  ExportResult,
  ValidationResult,
  ExportError,
  ExportMetadata,
  ExportStats,
  ProjectExportData,
  ComparisonExportData,
  ExportPreview,
} from './export'

describe('Export Types', () => {
  describe('ExportFormat', () => {
    it('should accept valid export formats', () => {
      const formats: ExportFormat[] = ['json', 'markdown', 'csv']
      expect(formats).toBeDefined()
    })
  })

  describe('ExportOptions', () => {
    it('should validate export options structure', () => {
      const options: ExportOptions = {
        format: 'json',
        includeInherited: true,
        includeMCP: true,
        includeAgents: true,
        includeMetadata: true,
      }
      expect(options.format).toBe('json')
      expect(options.includeInherited).toBe(true)
    })
  })

  describe('ExportData', () => {
    it('should validate export data structure', () => {
      const data: ExportData = {
        exportedAt: new Date().toISOString(),
        exportType: 'project',
        project: {
          name: 'test-project',
          path: '/path/to/project',
          configurations: {
            mcp: [],
            agents: [],
            inherited: [],
          },
        },
        metadata: {
          version: '1.0',
          exportFormat: 'json',
        },
      }
      expect(data.exportType).toBe('project')
      expect(data.project.name).toBe('test-project')
    })
  })

  describe('ExportResult', () => {
    it('should validate successful export result', () => {
      const result: ExportResult = {
        success: true,
        filePath: '/downloads/project-config.json',
        format: 'json',
        stats: {
          recordCount: 10,
          fileSize: 1024,
          duration: 150,
        },
      }
      expect(result.success).toBe(true)
      expect(result.filePath).toBeDefined()
      expect(result.stats?.recordCount).toBe(10)
    })

    it('should validate failed export result', () => {
      const result: ExportResult = {
        success: false,
        format: 'json',
        error: {
          type: 'filesystem',
          message: 'Permission denied',
          code: 'EACCES',
        },
      }
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('filesystem')
    })
  })

  describe('ValidationResult', () => {
    it('should validate validation result structure', () => {
      const validation: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      }
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toEqual([])
    })
  })

  describe('ExportMetadata', () => {
    it('should validate export metadata structure', () => {
      const metadata: ExportMetadata = {
        version: '1.0',
        exportFormat: 'json',
        timestamp: new Date().toISOString(),
        sourceType: 'project',
        recordCount: 10,
        fileSize: 1024,
        includeInherited: true,
        includeMCP: true,
        includeAgents: true,
      }
      expect(metadata.sourceType).toBe('project')
      expect(metadata.recordCount).toBe(10)
    })
  })

  describe('ExportStats', () => {
    it('should validate export statistics structure', () => {
      const stats: ExportStats = {
        totalExports: 100,
        successfulExports: 95,
        failedExports: 5,
        averageFileSize: 2048,
        mostUsedFormat: 'json',
      }
      expect(stats.totalExports).toBe(100)
      expect(stats.successfulExports).toBe(95)
      expect(stats.mostUsedFormat).toBe('json')
    })
  })

  describe('ProjectExportData', () => {
    it('should validate project export data structure', () => {
      const data: ProjectExportData = {
        project: {
          id: '1',
          name: 'test-project',
          path: '/path/to/project',
          configFileCount: 2,
          lastModified: new Date(),
          configSources: {
            user: true,
            project: true,
            local: false,
          },
          mcpServers: [],
          subAgents: [],
        },
        configurations: {
          mcp: [],
          agents: [],
          inherited: [],
        },
        metadata: {
          version: '1.0',
          exportFormat: 'json',
          timestamp: new Date().toISOString(),
          sourceType: 'project',
          recordCount: 10,
          fileSize: 1024,
          includeInherited: true,
          includeMCP: true,
          includeAgents: true,
        },
      }
      expect(data.project.name).toBe('test-project')
      expect(data.configurations.mcp).toBeDefined()
    })
  })

  describe('ComparisonExportData', () => {
    it('should validate comparison export data structure', () => {
      const data: ComparisonExportData = {
        leftProject: {
          id: '1',
          name: 'project-a',
          path: '/path/to/a',
          configFileCount: 2,
          lastModified: new Date(),
          configSources: {
            user: true,
            project: true,
            local: false,
          },
          mcpServers: [],
          subAgents: [],
        },
        rightProject: {
          id: '2',
          name: 'project-b',
          path: '/path/to/b',
          configFileCount: 2,
          lastModified: new Date(),
          configSources: {
            user: true,
            project: true,
            local: false,
          },
          mcpServers: [],
          subAgents: [],
        },
        diffResults: [],
        metadata: {
          version: '1.0',
          exportFormat: 'markdown',
          timestamp: new Date().toISOString(),
          sourceType: 'comparison',
          recordCount: 5,
          fileSize: 512,
          includeInherited: true,
          includeMCP: true,
          includeAgents: true,
        },
      }
      expect(data.leftProject.name).toBe('project-a')
      expect(data.rightProject.name).toBe('project-b')
      expect(data.metadata.sourceType).toBe('comparison')
    })
  })

  describe('ExportPreview', () => {
    it('should validate export preview structure', () => {
      const preview: ExportPreview = {
        format: 'json',
        content: '{ "test": "data" }',
        recordCount: 10,
        estimatedSize: 1024,
        options: {
          format: 'json',
          includeInherited: true,
          includeMCP: true,
          includeAgents: true,
          includeMetadata: true,
        },
      }
      expect(preview.format).toBe('json')
      expect(preview.recordCount).toBe(10)
      expect(preview.options.format).toBe('json')
    })
  })

  describe('Type Guards', () => {
    it('should validate isExportFormat function', () => {
      const isValidFormat = (value: string): value is ExportFormat => {
        return ['json', 'markdown', 'csv'].includes(value)
      }

      expect(isValidFormat('json')).toBe(true)
      expect(isValidFormat('csv')).toBe(true)
      expect(isValidFormat('pdf')).toBe(false)
    })

    it('should validate isExportResult function', () => {
      const isExportResult = (obj: any): obj is ExportResult => {
        return (
          typeof obj === 'object' &&
          typeof obj.success === 'boolean' &&
          typeof obj.format === 'string'
        )
      }

      expect(
        isExportResult({
          success: true,
          format: 'json',
        })
      ).toBe(true)

      expect(isExportResult(null)).toBe(false)
      expect(isExportResult({})).toBe(false)
    })
  })

  describe('Constants', () => {
    it('should define export format constants', () => {
      const EXPORT_FORMATS: ExportFormat[] = ['json', 'markdown', 'csv']
      expect(EXPORT_FORMATS).toEqual(['json', 'markdown', 'csv'])
    })

    it('should define default export options', () => {
      const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
        format: 'json',
        includeInherited: true,
        includeMCP: true,
        includeAgents: true,
        includeMetadata: true,
      }
      expect(DEFAULT_EXPORT_OPTIONS.format).toBe('json')
    })
  })
})
