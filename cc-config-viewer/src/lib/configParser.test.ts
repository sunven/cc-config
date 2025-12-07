import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseConfigFile,
  stringifyConfig,
  extractConfigEntries,
  extractMcpServers,
  extractSubAgents,
  extractAllEntries,
  readAndParseConfig,
} from './configParser'

// Mock the tauriApi module
vi.mock('./tauriApi', () => ({
  readConfig: vi.fn(),
  parseConfig: vi.fn(),
  watchConfig: vi.fn(),
}))

import { readConfig, parseConfig } from './tauriApi'

describe('configParser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseConfigFile', () => {
    it('parses valid JSON', () => {
      const config = { key: 'value', number: 42 }
      const result = parseConfigFile(JSON.stringify(config))
      expect(result).toEqual(config)
    })

    it('throws error for invalid JSON', () => {
      expect(() => parseConfigFile('{ invalid json }')).toThrow('Invalid JSON')
    })
  })

  describe('stringifyConfig', () => {
    it('stringifies config to formatted JSON', () => {
      const config = { key: 'value', number: 42 }
      const result = stringifyConfig(config)
      const parsed = JSON.parse(result)
      expect(parsed).toEqual(config)
    })
  })

  describe('extractConfigEntries', () => {
    it('extracts all entries from config', () => {
      const config = {
        setting1: 'value1',
        setting2: 'value2',
        setting3: 42,
      }

      const entries = extractConfigEntries(config, 'user')

      expect(entries).toHaveLength(3)
      expect(entries[0]).toEqual({
        key: 'setting1',
        value: 'value1',
        source: { type: 'user', path: '', priority: 1 },
      })
      expect(entries[1]).toEqual({
        key: 'setting2',
        value: 'value2',
        source: { type: 'user', path: '', priority: 1 },
      })
      expect(entries[2]).toEqual({
        key: 'setting3',
        value: 42,
        source: { type: 'user', path: '', priority: 1 },
      })
    })

    it('uses correct priority for different sources', () => {
      const config = { key: 'value' }

      const userEntries = extractConfigEntries(config, 'user')
      const projectEntries = extractConfigEntries(config, 'project')
      const localEntries = extractConfigEntries(config, 'local')

      expect(userEntries[0].source.priority).toBe(1)
      expect(projectEntries[0].source.priority).toBe(2)
      expect(localEntries[0].source.priority).toBe(3)
    })
  })

  describe('extractMcpServers', () => {
    it('extracts MCP servers with mcpServers key', () => {
      const config = {
        mcpServers: {
          server1: { type: 'stdio', command: 'node' },
          server2: { type: 'http', url: 'http://localhost' },
        },
      }

      const entries = extractMcpServers(config, 'user')

      expect(entries).toHaveLength(2)
      expect(entries[0]).toEqual({
        key: 'mcpServers.server1',
        value: { type: 'stdio', command: 'node' },
        source: { type: 'user', path: '', priority: 1 },
      })
      expect(entries[1]).toEqual({
        key: 'mcpServers.server2',
        value: { type: 'http', url: 'http://localhost' },
        source: { type: 'user', path: '', priority: 1 },
      })
    })

    it('extracts MCP servers with mcp_servers key', () => {
      const config = {
        mcp_servers: {
          server1: { type: 'stdio', command: 'node' },
        },
      }

      const entries = extractMcpServers(config, 'user')

      expect(entries).toHaveLength(1)
      expect(entries[0].key).toBe('mcpServers.server1')
    })

    it('returns empty array when no MCP servers found', () => {
      const config = { otherSetting: 'value' }
      const entries = extractMcpServers(config, 'user')
      expect(entries).toEqual([])
    })

    it('uses correct source type for project scope', () => {
      const config = {
        mcpServers: {
          server1: { type: 'stdio', command: 'node' },
        },
      }

      const entries = extractMcpServers(config, 'project')

      expect(entries[0].source.type).toBe('project')
      expect(entries[0].source.priority).toBe(2)
    })
  })

  describe('extractSubAgents', () => {
    it('extracts sub agents with subAgents key', () => {
      const config = {
        subAgents: {
          agent1: { type: 'coding', permissions: ['read'] },
          agent2: { type: 'analysis', permissions: ['read', 'write'] },
        },
      }

      const entries = extractSubAgents(config, 'user')

      expect(entries).toHaveLength(2)
      expect(entries[0]).toEqual({
        key: 'subAgents.agent1',
        value: { type: 'coding', permissions: ['read'] },
        source: { type: 'user', path: '', priority: 1 },
      })
    })

    it('extracts sub agents with sub_agents key', () => {
      const config = {
        sub_agents: {
          agent1: { type: 'coding' },
        },
      }

      const entries = extractSubAgents(config, 'user')

      expect(entries).toHaveLength(1)
      expect(entries[0].key).toBe('subAgents.agent1')
    })

    it('extracts sub agents with agents key', () => {
      const config = {
        agents: {
          agent1: { type: 'coding' },
        },
      }

      const entries = extractSubAgents(config, 'user')

      expect(entries).toHaveLength(1)
      expect(entries[0].key).toBe('subAgents.agent1')
    })

    it('returns empty array when no sub agents found', () => {
      const config = { otherSetting: 'value' }
      const entries = extractSubAgents(config, 'user')
      expect(entries).toEqual([])
    })

    it('uses correct source type for project scope', () => {
      const config = {
        subAgents: {
          agent1: { type: 'coding' },
        },
      }

      const entries = extractSubAgents(config, 'project')

      expect(entries[0].source.type).toBe('project')
      expect(entries[0].source.priority).toBe(2)
    })
  })

  describe('extractAllEntries', () => {
    it('combines all entry types', () => {
      const config = {
        setting1: 'value1',
        mcpServers: {
          server1: { type: 'stdio' },
        },
        subAgents: {
          agent1: { type: 'coding' },
        },
      }

      const entries = extractAllEntries(config, 'user')

      expect(entries).toHaveLength(3)
      expect(entries.map((e) => e.key)).toEqual([
        'setting1',
        'mcpServers.server1',
        'subAgents.agent1',
      ])
    })

    it('handles config with only some entry types', () => {
      const config = {
        setting1: 'value1',
        mcpServers: {
          server1: { type: 'stdio' },
        },
      }

      const entries = extractAllEntries(config, 'project')

      expect(entries).toHaveLength(2)
      expect(entries[0].source.type).toBe('project')
      expect(entries[1].source.type).toBe('project') // MCP servers now use the provided source type
    })
  })

  describe('readAndParseConfig', () => {
    it('reads and parses config successfully', async () => {
      const mockContent = '{"key": "value", "number": 42}'
      const mockParsed = { key: 'value', number: 42 }

      ;(readConfig as vi.MockedFunction<typeof readConfig>).mockResolvedValue(mockContent)
      ;(parseConfig as vi.MockedFunction<typeof parseConfig>).mockResolvedValue(mockParsed)

      const result = await readAndParseConfig('~/.claude.json')

      expect(readConfig).toHaveBeenCalledWith('~/.claude.json')
      expect(parseConfig).toHaveBeenCalledWith(mockContent)
      expect(result).toEqual(mockParsed)
    })

    it('throws error when readConfig fails', async () => {
      ;(readConfig as vi.MockedFunction<typeof readConfig>).mockRejectedValue(new Error('File not found'))

      await expect(readAndParseConfig('~/.claude.json')).rejects.toThrow('File not found')
    })

    it('throws error when parseConfig fails', async () => {
      const mockContent = 'invalid json'
      ;(readConfig as vi.MockedFunction<typeof readConfig>).mockResolvedValue(mockContent)
      ;(parseConfig as vi.MockedFunction<typeof parseConfig>).mockRejectedValue(new Error('Parse error'))

      await expect(readAndParseConfig('~/.claude.json')).rejects.toThrow('Parse error')
    })
  })
})
