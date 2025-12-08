import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectCurrentProject,
  discoverProjects,
  validateProjectPath,
  countMcpServers,
  countAgents,
  generateProjectId,
} from './projectDetection'
import * as tauriApi from './tauriApi'

// Mock tauri API
vi.mock('./tauriApi', () => ({
  readConfig: vi.fn(),
}))

describe('projectDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectCurrentProject', () => {
    it('returns null when no project detected', async () => {
      vi.mocked(tauriApi.readConfig).mockRejectedValue(new Error('File not found'))

      const result = await detectCurrentProject()

      expect(result).toBeNull()
    })

    it('detects project from .mcp.json in current directory', async () => {
      vi.mocked(tauriApi.readConfig).mockResolvedValue('{"mcpServers":{}}')

      const result = await detectCurrentProject()

      expect(result).not.toBeNull()
      expect(result?.name).toBe('cc-config-viewer')
      expect(result?.configPath).toContain('.mcp.json')
    })

    it('detects project from .claude/agents/ directory', async () => {
      // First call (mcp.json) fails, second call (.claude/agents) succeeds
      vi.mocked(tauriApi.readConfig)
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce('# Agent file')

      const result = await detectCurrentProject()

      expect(result).not.toBeNull()
      expect(result?.name).toBe('cc-config-viewer')
    })

    it('generates unique project ID', async () => {
      vi.mocked(tauriApi.readConfig).mockResolvedValue('{"mcpServers":{}}')

      const result = await detectCurrentProject()

      expect(result?.id).toBeDefined()
      expect(typeof result?.id).toBe('string')
      expect(result?.id.length).toBeGreaterThan(0)
    })

    it('uses current working directory name as project name', async () => {
      vi.mocked(tauriApi.readConfig).mockResolvedValue('{"mcpServers":{}}')

      const result = await detectCurrentProject()

      expect(result?.name).toBe('cc-config-viewer') // Current directory name
    })
  })

  describe('discoverProjects', () => {
    it('returns empty array when no projects found', async () => {
      vi.mocked(tauriApi.readConfig).mockRejectedValue(new Error('File not found'))

      const result = await discoverProjects()

      expect(result).toEqual([])
    })

    it('discovers projects from ~/.claude.json projects field', async () => {
      const mockUserConfig = JSON.stringify({
        projects: {
          'my-project': {
            path: '/Users/test/my-project',
            lastOpened: '2025-01-01T00:00:00.000Z',
          },
          'another-project': {
            path: '/Users/test/another-project',
          },
        },
      })

      // First call returns user config, subsequent calls for validation succeed
      vi.mocked(tauriApi.readConfig)
        .mockResolvedValueOnce(mockUserConfig) // ~/.claude.json
        .mockResolvedValue('{}') // path validation and mcp count calls

      const result = await discoverProjects()

      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result.find((p) => p.name === 'my-project')).toBeDefined()
      expect(result.find((p) => p.name === 'another-project')).toBeDefined()
    })

    it('handles invalid project paths gracefully', async () => {
      const mockUserConfig = JSON.stringify({
        projects: {
          'valid-project': {
            path: '/Users/test/valid-project',
          },
          'invalid-project': {
            path: '/nonexistent/path',
          },
        },
      })

      // Use mockImplementation to handle the complex call patterns
      vi.mocked(tauriApi.readConfig).mockImplementation(async (path: string) => {
        // User config
        if (path === '~/.claude.json') {
          return mockUserConfig
        }
        // Valid project paths
        if (path.includes('/Users/test/valid-project')) {
          return '{}'
        }
        // Invalid project paths - always fail
        if (path.includes('/nonexistent/path')) {
          throw new Error('Path not found')
        }
        // detectCurrentProject paths - fail
        if (path === './.mcp.json' || path.includes('.claude')) {
          throw new Error('Not found')
        }
        throw new Error('Unknown path')
      })

      const result = await discoverProjects()

      const validProject = result.find((p) => p.name === 'valid-project')
      const invalidProject = result.find((p) => p.name === 'invalid-project')

      expect(validProject?.status).toBe('valid')
      expect(invalidProject?.status).toBe('missing')
    })

    it('sorts projects by lastAccessed timestamp (most recent first)', async () => {
      const mockUserConfig = JSON.stringify({
        projects: {
          'old-project': {
            path: '/Users/test/old-project',
            lastOpened: '2024-01-01T00:00:00.000Z',
          },
          'recent-project': {
            path: '/Users/test/recent-project',
            lastOpened: '2025-06-01T00:00:00.000Z',
          },
          'middle-project': {
            path: '/Users/test/middle-project',
            lastOpened: '2025-03-01T00:00:00.000Z',
          },
        },
      })

      vi.mocked(tauriApi.readConfig)
        .mockResolvedValueOnce(mockUserConfig)
        .mockResolvedValue('{}')

      const result = await discoverProjects()

      // Filter to just the test projects
      const testProjects = result.filter((p) =>
        ['old-project', 'recent-project', 'middle-project'].includes(p.name)
      )

      expect(testProjects[0].name).toBe('recent-project')
      expect(testProjects[1].name).toBe('middle-project')
      expect(testProjects[2].name).toBe('old-project')
    })

    it('includes mcpCount and agentCount for each project', async () => {
      const mockUserConfig = JSON.stringify({
        projects: {
          'test-project': {
            path: '/Users/test/test-project',
          },
        },
      })

      const mockMcpConfig = JSON.stringify({
        mcpServers: {
          server1: { command: 'cmd1' },
          server2: { command: 'cmd2' },
        },
      })

      vi.mocked(tauriApi.readConfig)
        .mockResolvedValueOnce(mockUserConfig) // ~/.claude.json
        .mockResolvedValueOnce(mockMcpConfig) // project .mcp.json for validation + count
        .mockResolvedValue('{}') // agents directory

      const result = await discoverProjects()

      const testProject = result.find((p) => p.name === 'test-project')
      expect(testProject?.mcpCount).toBeDefined()
      expect(typeof testProject?.mcpCount).toBe('number')
    })
  })

  describe('validateProjectPath', () => {
    it('returns true for existing project path', async () => {
      vi.mocked(tauriApi.readConfig).mockResolvedValue('{}')

      const result = await validateProjectPath('/Users/test/existing-project')

      expect(result).toBe(true)
    })

    it('returns false for non-existing project path', async () => {
      vi.mocked(tauriApi.readConfig).mockRejectedValue(new Error('Not found'))

      const result = await validateProjectPath('/nonexistent/path')

      expect(result).toBe(false)
    })
  })

  describe('countMcpServers', () => {
    it('returns 0 when no .mcp.json exists', async () => {
      vi.mocked(tauriApi.readConfig).mockRejectedValue(new Error('File not found'))

      const result = await countMcpServers('/Users/test/project')

      expect(result).toBe(0)
    })

    it('counts mcpServers from .mcp.json', async () => {
      const mockConfig = JSON.stringify({
        mcpServers: {
          server1: { command: 'cmd1' },
          server2: { command: 'cmd2' },
          server3: { command: 'cmd3' },
        },
      })

      vi.mocked(tauriApi.readConfig).mockResolvedValue(mockConfig)

      const result = await countMcpServers('/Users/test/project')

      expect(result).toBe(3)
    })

    it('returns 0 when mcpServers is empty or missing', async () => {
      vi.mocked(tauriApi.readConfig).mockResolvedValue('{}')

      const result = await countMcpServers('/Users/test/project')

      expect(result).toBe(0)
    })
  })

  describe('countAgents', () => {
    it('returns 0 when .claude/agents directory does not exist', async () => {
      vi.mocked(tauriApi.readConfig).mockRejectedValue(new Error('Directory not found'))

      const result = await countAgents('/Users/test/project')

      expect(result).toBe(0)
    })
  })

  describe('generateProjectId', () => {
    it('generates consistent ID for same path', () => {
      const path1 = '/Users/test/project'
      const path2 = '/Users/test/project'

      const id1 = generateProjectId(path1)
      const id2 = generateProjectId(path2)

      expect(id1).toBe(id2)
    })

    it('generates different IDs for different paths', () => {
      const path1 = '/Users/test/project1'
      const path2 = '/Users/test/project2'

      const id1 = generateProjectId(path1)
      const id2 = generateProjectId(path2)

      expect(id1).not.toBe(id2)
    })

    it('returns a non-empty string', () => {
      const id = generateProjectId('/some/path')

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })
})
