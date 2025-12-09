import { describe, it, expect } from 'vitest'
import type { UnifiedCapability } from '../types/capability'

// Import the functions to test (will implement after tests)
import {
  calculateCapabilityStats,
  getStatsForScope,
  type CapabilityStats,
  type StatsBreakdown
} from './capabilityStats'

// Mock unified capabilities for testing
const mockCapabilities: UnifiedCapability[] = [
  {
    id: 'mcp-1',
    type: 'mcp',
    name: 'filesystem',
    description: 'File system access',
    status: 'active',
    source: 'user',
    sourcePath: '/home/user/.claude.json',
    mcpData: {
      name: 'filesystem',
      type: 'stdio',
      description: 'File system access',
      config: { command: 'mcp-server-fs' },
      status: 'active',
      sourcePath: '/home/user/.claude.json'
    }
  },
  {
    id: 'mcp-2',
    type: 'mcp',
    name: 'web-search',
    description: 'Web search capabilities',
    status: 'active',
    source: 'project',
    sourcePath: './.mcp.json',
    mcpData: {
      name: 'web-search',
      type: 'http',
      description: 'Web search capabilities',
      config: { url: 'https://example.com/api' },
      status: 'active',
      sourcePath: './.mcp.json'
    }
  },
  {
    id: 'mcp-3',
    type: 'mcp',
    name: 'database',
    status: 'inactive',
    source: 'user',
    sourcePath: '/home/user/.claude.json',
    mcpData: {
      name: 'database',
      type: 'stdio',
      config: { command: 'mcp-db' },
      status: 'inactive',
      sourcePath: '/home/user/.claude.json'
    }
  },
  {
    id: 'agent-1',
    type: 'agent',
    name: 'Code Reviewer',
    description: 'Reviews code for quality',
    status: 'active',
    source: 'project',
    sourcePath: './.claude/agents/code-reviewer.md',
    agentData: {
      id: 'agent-1',
      name: 'Code Reviewer',
      description: 'Reviews code for quality',
      model: {
        name: 'claude-3-sonnet',
        provider: 'anthropic'
      },
      permissions: {
        type: 'read',
        scopes: ['code', 'files']
      },
      status: 'active',
      sourcePath: './.claude/agents/code-reviewer.md',
      lastModified: new Date('2024-01-01')
    }
  },
  {
    id: 'agent-2',
    type: 'agent',
    name: 'Test Writer',
    status: 'active',
    source: 'user',
    sourcePath: '/home/user/.claude/agents/test-writer.md',
    agentData: {
      id: 'agent-2',
      name: 'Test Writer',
      model: {
        name: 'claude-3-haiku',
        provider: 'anthropic'
      },
      permissions: {
        type: 'write',
        scopes: ['tests', 'files']
      },
      status: 'active',
      sourcePath: '/home/user/.claude/agents/test-writer.md',
      lastModified: new Date('2024-01-02')
    }
  }
]

describe('capabilityStats', () => {
  describe('calculateCapabilityStats', () => {
    it('should calculate total MCP and Agents counts', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.totalMcp).toBe(3)
      expect(stats.totalAgents).toBe(2)
      expect(stats.totalCount).toBe(5)
    })

    it('should determine most used capability type', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.mostUsedType).toBe('mcp') // 3 MCP vs 2 Agents
    })

    it('should return "equal" when counts are equal', () => {
      // Create exactly 2 MCP and 2 Agents
      const equalCapabilities = [
        mockCapabilities[0], // MCP
        mockCapabilities[1], // MCP
        mockCapabilities[3], // Agent
        mockCapabilities[4]  // Agent
      ]
      const stats = calculateCapabilityStats(equalCapabilities)
      expect(stats.mostUsedType).toBe('equal')
    })

    it('should calculate unique vs inherited capabilities', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      // From mock data:
      // user: 2 MCP + 1 Agent = 3
      // project: 1 MCP + 1 Agent = 2
      // Total unique: 5 (all are unique in this mock)
      expect(stats.unique).toBe(5)
      expect(stats.inherited).toBe(0)
      expect(stats.overridden).toBe(0)
    })

    it('should calculate percentages correctly', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.percentages.mcp).toBe(60) // 3/5 * 100
      expect(stats.percentages.agents).toBe(40) // 2/5 * 100
      expect(stats.percentages.unique).toBe(100) // 5/5 * 100
      expect(stats.percentages.inherited).toBe(0)
      expect(stats.percentages.overridden).toBe(0)
    })

    it('should handle empty capabilities array', () => {
      const stats = calculateCapabilityStats([])
      expect(stats.totalMcp).toBe(0)
      expect(stats.totalAgents).toBe(0)
      expect(stats.totalCount).toBe(0)
      expect(stats.mostUsedType).toBe('equal')
      expect(stats.unique).toBe(0)
      expect(stats.inherited).toBe(0)
      expect(stats.overridden).toBe(0)
      expect(stats.percentages.mcp).toBe(0)
      expect(stats.percentages.agents).toBe(0)
    })

    it('should handle only MCP servers', () => {
      const mcpOnly = mockCapabilities.filter(c => c.type === 'mcp')
      const stats = calculateCapabilityStats(mcpOnly)
      expect(stats.totalMcp).toBe(3)
      expect(stats.totalAgents).toBe(0)
      expect(stats.mostUsedType).toBe('mcp')
      expect(stats.percentages.mcp).toBe(100)
      expect(stats.percentages.agents).toBe(0)
    })

    it('should handle only Agents', () => {
      const agentOnly = mockCapabilities.filter(c => c.type === 'agent')
      const stats = calculateCapabilityStats(agentOnly)
      expect(stats.totalMcp).toBe(0)
      expect(stats.totalAgents).toBe(2)
      expect(stats.mostUsedType).toBe('agents')
      expect(stats.percentages.mcp).toBe(0)
      expect(stats.percentages.agents).toBe(100)
    })

    it('should provide breakdown by source', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.breakdown).toBeDefined()
      expect(stats.breakdown.user).toBeDefined()
      expect(stats.breakdown.project).toBeDefined()
      expect(stats.breakdown.local).toBeDefined()

      // Verify counts
      expect(stats.breakdown.user.total).toBe(3) // 2 MCP + 1 Agent
      expect(stats.breakdown.project.total).toBe(2) // 1 MCP + 1 Agent
      expect(stats.breakdown.local.total).toBe(0)

      // Verify type distribution
      expect(stats.breakdown.user.mcp).toBe(2)
      expect(stats.breakdown.user.agents).toBe(1)
      expect(stats.breakdown.project.mcp).toBe(1)
      expect(stats.breakdown.project.agents).toBe(1)
    })

    it('should calculate stats for specific scope', () => {
      const userStats = calculateCapabilityStats(mockCapabilities, 'user')
      const projectStats = calculateCapabilityStats(mockCapabilities, 'project')

      // User scope should only include user sources
      expect(userStats.totalMcp).toBe(2)
      expect(userStats.totalAgents).toBe(1)
      expect(userStats.totalCount).toBe(3)

      // Project scope should only include project sources
      expect(projectStats.totalMcp).toBe(1)
      expect(projectStats.totalAgents).toBe(1)
      expect(projectStats.totalCount).toBe(2)
    })

    it('should return empty stats for invalid scope', () => {
      const localStats = calculateCapabilityStats(mockCapabilities, 'local')
      expect(localStats.totalMcp).toBe(0)
      expect(localStats.totalAgents).toBe(0)
      expect(localStats.totalCount).toBe(0)
    })

    it('should meet performance requirements (<200ms)', () => {
      const start = performance.now()
      calculateCapabilityStats(mockCapabilities)
      const end = performance.now()
      expect(end - start).toBeLessThan(200)
    })
  })

  describe('getStatsForScope', () => {
    it('should filter capabilities by scope', () => {
      const userCapabilities = getStatsForScope(mockCapabilities, 'user')
      expect(userCapabilities.length).toBe(3)
      expect(userCapabilities.every(c => c.source === 'user')).toBe(true)
    })

    it('should filter project scope correctly', () => {
      const projectCapabilities = getStatsForScope(mockCapabilities, 'project')
      expect(projectCapabilities.length).toBe(2)
      expect(projectCapabilities.every(c => c.source === 'project')).toBe(true)
    })

    it('should return empty array for non-existent scope', () => {
      const localCapabilities = getStatsForScope(mockCapabilities, 'local')
      expect(localCapabilities.length).toBe(0)
    })

    it('should return all capabilities when scope is undefined', () => {
      const allCapabilities = getStatsForScope(mockCapabilities, undefined)
      expect(allCapabilities.length).toBe(mockCapabilities.length)
    })
  })

  describe('Stats structure validation', () => {
    it('should have all required fields', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats).toHaveProperty('totalMcp')
      expect(stats).toHaveProperty('totalAgents')
      expect(stats).toHaveProperty('totalCount')
      expect(stats).toHaveProperty('mostUsedType')
      expect(stats).toHaveProperty('unique')
      expect(stats).toHaveProperty('inherited')
      expect(stats).toHaveProperty('overridden')
      expect(stats).toHaveProperty('percentages')
      expect(stats).toHaveProperty('breakdown')
    })

    it('should have correct types for all fields', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(typeof stats.totalMcp).toBe('number')
      expect(typeof stats.totalAgents).toBe('number')
      expect(typeof stats.totalCount).toBe('number')
      expect(typeof stats.mostUsedType).toBe('string')
      expect(['mcp', 'agents', 'equal']).toContain(stats.mostUsedType)
      expect(typeof stats.unique).toBe('number')
      expect(typeof stats.inherited).toBe('number')
      expect(typeof stats.overridden).toBe('number')
      expect(typeof stats.percentages).toBe('object')
      expect(typeof stats.breakdown).toBe('object')
    })

    it('should have percentages object with correct structure', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.percentages).toHaveProperty('mcp')
      expect(stats.percentages).toHaveProperty('agents')
      expect(stats.percentages).toHaveProperty('unique')
      expect(stats.percentages).toHaveProperty('inherited')
      expect(stats.percentages).toHaveProperty('overridden')

      // All percentages should be between 0 and 100
      Object.values(stats.percentages).forEach(pct => {
        expect(pct).toBeGreaterThanOrEqual(0)
        expect(pct).toBeLessThanOrEqual(100)
      })
    })

    it('should have breakdown object with correct structure', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.breakdown).toHaveProperty('user')
      expect(stats.breakdown).toHaveProperty('project')
      expect(stats.breakdown).toHaveProperty('local')

      // Each breakdown should have total, mcp, and agents
      Object.values(stats.breakdown).forEach(breakdown => {
        expect(breakdown).toHaveProperty('total')
        expect(breakdown).toHaveProperty('mcp')
        expect(breakdown).toHaveProperty('agents')
        expect(typeof breakdown.total).toBe('number')
        expect(typeof breakdown.mcp).toBe('number')
        expect(typeof breakdown.agents).toBe('number')
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined capabilities gracefully', () => {
      expect(() => calculateCapabilityStats(undefined as any)).not.toThrow()
      const stats = calculateCapabilityStats(undefined as any)
      expect(stats.totalCount).toBe(0)
    })

    it('should handle capabilities with missing data', () => {
      const incompleteCapabilities: UnifiedCapability[] = [
        {
          id: 'test',
          type: 'mcp',
          name: 'Test',
          status: 'active',
          source: 'user',
          sourcePath: '/test.json'
          // Missing mcpData
        }
      ]
      const stats = calculateCapabilityStats(incompleteCapabilities)
      expect(stats.totalMcp).toBe(1)
      expect(stats.totalCount).toBe(1)
    })

    it('should calculate correct percentages when totals are zero', () => {
      const stats = calculateCapabilityStats([])
      expect(stats.percentages.mcp).toBe(0)
      expect(stats.percentages.agents).toBe(0)
      expect(stats.percentages.unique).toBe(0)
      expect(stats.percentages.inherited).toBe(0)
      expect(stats.percentages.overridden).toBe(0)
    })
  })

  describe('Acceptance Criteria Coverage', () => {
    it('AC #1: Total MCP count & Total Agents count', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.totalMcp).toBe(3)
      expect(stats.totalAgents).toBe(2)
    })

    it('AC #2: Most used capability type', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats.mostUsedType).toBe('mcp')
    })

    it('AC #3: Capabilities unique vs inherited', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(typeof stats.unique).toBe('number')
      expect(typeof stats.inherited).toBe('number')
      expect(typeof stats.overridden).toBe('number')
      expect(stats.unique + stats.inherited + stats.overridden).toBe(stats.totalCount)
    })

    it('AC #4: Growth over time (structure ready for future data)', () => {
      const stats = calculateCapabilityStats(mockCapabilities)
      expect(stats).toHaveProperty('lastUpdated')
      expect(stats.lastUpdated).toBeDefined()
    })
  })
})