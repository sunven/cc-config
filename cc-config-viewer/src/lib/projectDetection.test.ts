import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectCurrentProject } from './projectDetection'
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
})
