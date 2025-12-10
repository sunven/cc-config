import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import {
  parseConfigFile,
  stringifyConfig,
  extractConfigEntries,
  extractMcpServers,
  extractSubAgents,
  extractAllEntries,
  readAndParseConfig,
  parseMcpServers,
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
      const inheritedEntries = extractConfigEntries(config, 'inherited')

      expect(userEntries[0].source.priority).toBe(1)
      expect(projectEntries[0].source.priority).toBe(2)
      expect(inheritedEntries[0].source.priority).toBe(3)
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

      ;(readConfig as MockedFunction<typeof readConfig>).mockResolvedValue(mockContent)
      ;(parseConfig as MockedFunction<typeof parseConfig>).mockResolvedValue(mockParsed)

      const result = await readAndParseConfig('~/.claude.json')

      expect(readConfig).toHaveBeenCalledWith('~/.claude.json')
      expect(parseConfig).toHaveBeenCalledWith(mockContent)
      expect(result).toEqual(mockParsed)
    })

    it('throws error when readConfig fails', async () => {
      ;(readConfig as MockedFunction<typeof readConfig>).mockRejectedValue(new Error('File not found'))

      await expect(readAndParseConfig('~/.claude.json')).rejects.toThrow('File not found')
    })

    it('throws error when parseConfig fails', async () => {
      const mockContent = 'invalid json'
      ;(readConfig as MockedFunction<typeof readConfig>).mockResolvedValue(mockContent)
      ;(parseConfig as MockedFunction<typeof parseConfig>).mockRejectedValue(new Error('Parse error'))

      await expect(readAndParseConfig('~/.claude.json')).rejects.toThrow('Parse error')
    })
  })

  describe('parseMcpServers', () => {
    it('parses user-level MCP servers from ~/.claude.json', () => {
      const userConfig = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            description: 'File system operations'
          },
          postgres: {
            url: 'http://localhost:5432',
            description: 'PostgreSQL database'
          }
        }
      }

      const result = parseMcpServers(userConfig)

      expect(result.userMcpServers).toHaveLength(2)
      expect(result.userMcpServers[0]).toEqual({
        name: 'filesystem',
        type: 'stdio',
        description: 'File system operations',
        config: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
          description: 'File system operations'
        },
        status: 'inactive',
        sourcePath: '/home/user/.claude.json'
      })
      expect(result.userMcpServers[1]).toEqual({
        name: 'postgres',
        type: 'http',
        description: 'PostgreSQL database',
        config: {
          url: 'http://localhost:5432',
          description: 'PostgreSQL database'
        },
        status: 'inactive',
        sourcePath: '/home/user/.claude.json'
      })
    })

    it('parses project-level MCP servers from .mcp.json', () => {
      const projectConfig = {
        servers: {
          git: {
            command: 'python',
            args: ['mcp-git-server.py'],
            description: 'Git operations'
          },
          sse: {
            url: 'https://api.example.com/events',
            description: 'SSE server'
          }
        }
      }

      const result = parseMcpServers(undefined, projectConfig)

      expect(result.projectMcpServers).toHaveLength(2)
      expect(result.projectMcpServers[0]).toEqual({
        name: 'git',
        type: 'stdio',
        description: 'Git operations',
        config: {
          command: 'python',
          args: ['mcp-git-server.py'],
          description: 'Git operations'
        },
        status: 'inactive',
        sourcePath: './.mcp.json'
      })
      expect(result.projectMcpServers[1]).toEqual({
        name: 'sse',
        type: 'http',
        description: 'SSE server',
        config: {
          url: 'https://api.example.com/events',
          description: 'SSE server'
        },
        status: 'inactive',
        sourcePath: './.mcp.json'
      })
    })

    it('handles project-level .claude.json MCP servers', () => {
      const userConfig = {
        mcpServers: {
          shared: {
            command: 'python',
            description: 'Shared server'
          }
        }
      }

      const projectConfig = {
        mcpServers: {
          shared: {
            command: 'node',
            description: 'Overridden server'
          },
          projectOnly: {
            command: 'go',
            description: 'Project only server'
          }
        }
      }

      const result = parseMcpServers(userConfig, projectConfig)

      // Project-level should override user-level
      expect(result.projectMcpServers).toHaveLength(2)
      expect(result.projectMcpServers[0].name).toBe('shared')
      expect(result.projectMcpServers[0].config.command).toBe('node')
      expect(result.projectMcpServers[1].name).toBe('projectOnly')
      expect(result.inheritedMcpServers).toHaveLength(1)
      expect(result.inheritedMcpServers[0].name).toBe('shared')
      expect(result.inheritedMcpServers[0].config.command).toBe('python')
    })

    it('deduplicates servers by name', () => {
      const userConfig = {
        mcpServers: {
          server1: {
            command: 'python',
            description: 'User version'
          }
        }
      }

      const projectConfig = {
        servers: {
          server1: {
            command: 'node',
            description: 'Project version'
          }
        }
      }

      const result = parseMcpServers(userConfig, projectConfig)

      // Should only have one server1 in project servers (project overrides user)
      const allServers = [...result.userMcpServers, ...result.projectMcpServers]
      const server1Count = allServers.filter(s => s.name === 'server1').length
      expect(server1Count).toBe(1)
      expect(allServers[0].config.command).toBe('node')
    })

    it('returns empty arrays when no MCP servers found', () => {
      const emptyConfig = {}

      const result = parseMcpServers(emptyConfig, emptyConfig)

      expect(result.userMcpServers).toEqual([])
      expect(result.projectMcpServers).toEqual([])
      expect(result.inheritedMcpServers).toEqual([])
    })

    it('handles mixed configuration formats', () => {
      const userConfig = {
        mcpServers: {
          stdio: {
            command: 'python',
            args: ['server.py']
          }
        }
      }

      const projectConfig = {
        servers: {
          http: {
            url: 'http://localhost:3000'
          },
          headers: {
            url: 'http://localhost:4000',
            headers: {
              'Authorization': 'Bearer token'
            }
          }
        }
      }

      const result = parseMcpServers(userConfig, projectConfig)

      expect(result.userMcpServers[0].type).toBe('stdio')
      expect(result.projectMcpServers[0].type).toBe('http')
      expect(result.projectMcpServers[1].type).toBe('http')
    })

    it('handles servers without descriptions', () => {
      const config = {
        mcpServers: {
          noDesc: {
            command: 'python'
          }
        }
      }

      const result = parseMcpServers(config)

      expect(result.userMcpServers[0].description).toBe('noDesc MCP server')
    })

    it('normalizes server type based on config', () => {
      const config = {
        mcpServers: {
          explicitType: {
            type: 'http',
            url: 'http://localhost'
          },
          inferredHttp: {
            url: 'http://localhost'
          },
          inferredStdio: {
            command: 'python',
            args: ['server.py']
          },
          defaultType: {
            // No type or config hints - should default to stdio
          }
        }
      }

      const result = parseMcpServers(config)

      expect(result.userMcpServers[0].type).toBe('http')
      expect(result.userMcpServers[1].type).toBe('http')
      expect(result.userMcpServers[2].type).toBe('stdio')
      expect(result.userMcpServers[3].type).toBe('stdio')
    })

    it('returns null for invalid server configurations', () => {
      const config = {
        mcpServers: {
          valid: {
            command: 'python'
          }
        }
      }

      // Mock console.error to avoid noise in test output
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = parseMcpServers(config)

      expect(result.userMcpServers).toHaveLength(1)
      expect(result.userMcpServers[0].name).toBe('valid')

      vi.restoreAllMocks()
    })
  })
})
