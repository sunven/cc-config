import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  readConfigFile,
  parseConfigData,
  readConfig,
  parseConfig,
  watchConfig,
  healthCheckProject,
  calculateHealthMetrics,
  refreshAllProjectHealth,
} from './tauriApi'
import type { ProjectHealth, DiscoveredProject } from './tauriApi'

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'

describe('tauriApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('readConfigFile', () => {
    it('should read config file successfully', async () => {
      const mockContent = '{"key": "value"}'
      vi.mocked(invoke).mockResolvedValue(mockContent)

      const result = await readConfigFile('/path/to/config.json')

      expect(invoke).toHaveBeenCalledWith('read_config', { path: '/path/to/config.json' })
      expect(result).toBe(mockContent)
    })

    it('should handle filesystem errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Filesystem: 'File not found' })

      await expect(readConfigFile('/nonexistent.json')).rejects.toMatchObject({
        type: 'filesystem',
        message: expect.stringContaining('File system error'),
      })
    })

    it('should handle permission errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Permission: 'Access denied' })

      await expect(readConfigFile('/protected.json')).rejects.toMatchObject({
        type: 'permission',
        message: expect.stringContaining('Permission denied'),
      })
    })
  })

  describe('parseConfigData', () => {
    it('should parse config data successfully', async () => {
      const mockData = { key: 'value', nested: { foo: 'bar' } }
      vi.mocked(invoke).mockResolvedValue(mockData)

      const result = await parseConfigData('{"key": "value"}')

      expect(invoke).toHaveBeenCalledWith('parse_config', { content: '{"key": "value"}' })
      expect(result).toEqual(mockData)
    })

    it('should handle parse errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Parse: 'Invalid JSON' })

      await expect(parseConfigData('invalid json')).rejects.toMatchObject({
        type: 'parse',
        message: expect.stringContaining('Parse error'),
      })
    })

    it('should handle empty JSON object', async () => {
      const mockData = {}
      vi.mocked(invoke).mockResolvedValue(mockData)

      const result = await parseConfigData('{}')

      expect(result).toEqual({})
    })
  })

  describe('watchConfig', () => {
    it('should call watch_config with correct parameters', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      const callback = vi.fn()

      await watchConfig('/path/to/config.json', callback)

      expect(invoke).toHaveBeenCalledWith('watch_config', {
        path: '/path/to/config.json',
        callback,
      })
    })

    it('should handle network errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Network: 'Connection failed' })
      const callback = vi.fn()

      await expect(watchConfig('/path/to/config.json', callback)).rejects.toMatchObject({
        type: 'network',
        message: expect.stringContaining('Network error'),
      })
    })

    it('should handle filesystem errors during watch', async () => {
      vi.mocked(invoke).mockRejectedValue({ Filesystem: 'Cannot watch file' })
      const callback = vi.fn()

      await expect(watchConfig('/path/to/config.json', callback)).rejects.toMatchObject({
        type: 'filesystem',
        message: expect.stringContaining('File system error'),
      })
    })
  })

  describe('backwards compatibility', () => {
    it('readConfig should call readConfigFile', async () => {
      const mockContent = '{"test": true}'
      vi.mocked(invoke).mockResolvedValue(mockContent)

      const result = await readConfig('/path/to/config.json')

      expect(result).toBe(mockContent)
    })

    it('parseConfig should call parseConfigData', async () => {
      const mockData = { test: true }
      vi.mocked(invoke).mockResolvedValue(mockData)

      const result = await parseConfig('{"test": true}')

      expect(result).toEqual(mockData)
    })
  })

  describe('error conversion', () => {
    it('should convert unknown errors to filesystem type', async () => {
      vi.mocked(invoke).mockRejectedValue('Unknown error')

      await expect(readConfigFile('/test.json')).rejects.toMatchObject({
        type: 'filesystem',
        message: expect.stringContaining('Unknown error'),
      })
    })

    it('should preserve error details', async () => {
      const originalError = { Filesystem: 'Detailed error message' }
      vi.mocked(invoke).mockRejectedValue(originalError)

      await expect(readConfigFile('/test.json')).rejects.toMatchObject({
        details: originalError,
      })
    })

    it('should handle network errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Network: 'Connection timeout' })

      await expect(readConfigFile('/test.json')).rejects.toMatchObject({
        type: 'network',
        message: expect.stringContaining('Network error'),
      })
    })
  })

  describe('healthCheckProject', () => {
    it('should check project health successfully', async () => {
      const mockHealth: ProjectHealth = {
        projectId: 'project-1',
        status: 'good',
        score: 95,
        metrics: {
          totalCapabilities: 10,
          validConfigs: 10,
          invalidConfigs: 0,
          warnings: 0,
          errors: 0,
          lastChecked: '2024-01-01T00:00:00Z',
        },
        issues: [],
        recommendations: [],
      }
      vi.mocked(invoke).mockResolvedValue(mockHealth)

      const result = await healthCheckProject('/path/to/project')

      expect(invoke).toHaveBeenCalledWith('health_check_project', {
        projectPath: '/path/to/project',
      })
      expect(result).toEqual(mockHealth)
    })

    it('should handle health check errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Filesystem: 'Cannot read project' })

      await expect(healthCheckProject('/nonexistent')).rejects.toMatchObject({
        type: 'filesystem',
        message: expect.stringContaining('File system error'),
      })
    })

    it('should return error status for projects with issues', async () => {
      const mockHealth: ProjectHealth = {
        projectId: 'project-2',
        status: 'error',
        score: 30,
        metrics: {
          totalCapabilities: 10,
          validConfigs: 5,
          invalidConfigs: 5,
          warnings: 3,
          errors: 2,
          lastChecked: '2024-01-01T00:00:00Z',
        },
        issues: [
          {
            id: 'issue-1',
            type: 'error',
            severity: 'high',
            message: 'Invalid configuration',
            projectId: 'project-2',
          },
        ],
        recommendations: ['Fix invalid configurations'],
      }
      vi.mocked(invoke).mockResolvedValue(mockHealth)

      const result = await healthCheckProject('/path/to/broken')

      expect(result.status).toBe('error')
      expect(result.score).toBe(30)
      expect(result.issues).toHaveLength(1)
    })
  })

  describe('calculateHealthMetrics', () => {
    it('should calculate health metrics for multiple projects', async () => {
      const mockProjects: DiscoveredProject[] = [
        {
          id: 'project-1',
          name: 'Project Alpha',
          path: '/path/to/alpha',
          config_file_count: 10,
          last_modified: Math.floor(Date.now() / 1000),
          config_sources: { user: false, project: true, local: false },
        },
        {
          id: 'project-2',
          name: 'Project Beta',
          path: '/path/to/beta',
          config_file_count: 8,
          last_modified: Math.floor(Date.now() / 1000),
          config_sources: { user: false, project: true, local: false },
        },
      ]

      const mockHealthResults: ProjectHealth[] = [
        {
          projectId: 'project-1',
          status: 'good',
          score: 95,
          metrics: {
            totalCapabilities: 10,
            validConfigs: 10,
            invalidConfigs: 0,
            warnings: 0,
            errors: 0,
            lastChecked: '2024-01-01T00:00:00Z',
          },
          issues: [],
          recommendations: [],
        },
        {
          projectId: 'project-2',
          status: 'warning',
          score: 65,
          metrics: {
            totalCapabilities: 8,
            validConfigs: 7,
            invalidConfigs: 1,
            warnings: 2,
            errors: 0,
            lastChecked: '2024-01-01T00:00:00Z',
          },
          issues: [],
          recommendations: [],
        },
      ]

      vi.mocked(invoke).mockResolvedValue(mockHealthResults)

      const result = await calculateHealthMetrics(mockProjects)

      expect(invoke).toHaveBeenCalledWith('calculate_health_metrics', {
        projects: mockProjects,
      })
      expect(result).toHaveLength(2)
      expect(result[0].projectId).toBe('project-1')
      expect(result[1].projectId).toBe('project-2')
    })

    it('should handle errors during metrics calculation', async () => {
      vi.mocked(invoke).mockRejectedValue({ Permission: 'Access denied' })

      await expect(
        calculateHealthMetrics([
          {
            id: 'test',
            name: 'Test',
            path: '/test',
            config_file_count: 1,
            last_modified: Date.now(),
            config_sources: { user: false, project: true, local: false },
          },
        ])
      ).rejects.toMatchObject({
        type: 'permission',
        message: expect.stringContaining('Permission denied'),
      })
    })
  })

  describe('refreshAllProjectHealth', () => {
    it('should refresh health for all projects', async () => {
      const mockProjects: DiscoveredProject[] = [
        {
          id: 'project-1',
          name: 'Project Alpha',
          path: '/path/to/alpha',
          config_file_count: 10,
          last_modified: Math.floor(Date.now() / 1000),
          config_sources: { user: false, project: true, local: false },
        },
      ]

      const mockHealthResults: ProjectHealth[] = [
        {
          projectId: 'project-1',
          status: 'good',
          score: 98,
          metrics: {
            totalCapabilities: 10,
            validConfigs: 10,
            invalidConfigs: 0,
            warnings: 0,
            errors: 0,
            lastChecked: '2024-01-02T00:00:00Z',
          },
          issues: [],
          recommendations: [],
        },
      ]

      vi.mocked(invoke).mockResolvedValue(mockHealthResults)

      const result = await refreshAllProjectHealth(mockProjects)

      expect(invoke).toHaveBeenCalledWith('refresh_all_project_health', {
        projects: mockProjects,
      })
      expect(result).toHaveLength(1)
      expect(result[0].score).toBe(98)
    })

    it('should handle network errors during refresh', async () => {
      vi.mocked(invoke).mockRejectedValue({ Network: 'Connection timeout' })

      await expect(refreshAllProjectHealth([])).rejects.toMatchObject({
        type: 'network',
        message: expect.stringContaining('Network error'),
      })
    })

    it('should return empty array for empty project list', async () => {
      vi.mocked(invoke).mockResolvedValue([])

      const result = await refreshAllProjectHealth([])

      expect(result).toHaveLength(0)
    })
  })
})
