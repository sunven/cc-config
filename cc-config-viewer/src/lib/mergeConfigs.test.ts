import { describe, it, expect } from 'vitest'
import { mergeConfigs } from './configParser'

describe('mergeConfigs', () => {
  it('merges user and project configs correctly', () => {
    const userConfig = {
      mcpServers: {
        server1: { type: 'stdio', command: 'node' },
      },
      subAgents: {
        agent1: { type: 'coding', permissions: ['read'] },
      },
    }
    const projectConfig = {
      mcpServers: {
        server2: { type: 'http', url: 'http://localhost' },
      },
      subAgents: {
        agent2: { type: 'analysis', permissions: ['read', 'write'] },
      },
    }

    const merged = mergeConfigs(userConfig, projectConfig)

    // Should have 4 entries total (2 from user, 2 from project)
    expect(merged).toHaveLength(4)

    // Check user entries are marked as inherited
    const userEntries = merged.filter(e => e.source.type === 'user')
    expect(userEntries).toHaveLength(2)
    userEntries.forEach(entry => {
      expect(entry.inherited).toBe(true)
      expect(entry.overridden).toBeUndefined()
    })

    // Check project entries are not inherited
    const projectEntries = merged.filter(e => e.source.type === 'project')
    expect(projectEntries).toHaveLength(2)
    projectEntries.forEach(entry => {
      expect(entry.inherited).toBeUndefined()
      expect(entry.overridden).toBe(false)
    })
  })

  it('marks overridden user configs', () => {
    const userConfig = {
      setting1: 'user-value',
      mcpServers: {
        server1: { type: 'stdio', command: 'node' },
      },
    }
    const projectConfig = {
      setting1: 'project-value', // Override user setting
      mcpServers: {
        server2: { type: 'http' }, // New project server
      },
    }

    const merged = mergeConfigs(userConfig, projectConfig)

    // Should have 3 entries:
    // 1. setting1 (project, overridden)
    // 2. mcpServers.server1 (user, inherited)
    // 3. mcpServers.server2 (project, new)
    expect(merged).toHaveLength(3)

    // Check that setting1 is from project and marked as overridden
    const setting1Entry = merged.find(e => e.key === 'setting1')
    expect(setting1Entry).toBeDefined()
    expect(setting1Entry?.source.type).toBe('project')
    expect(setting1Entry?.value).toBe('project-value')
    expect(setting1Entry?.overridden).toBe(true)

    // Check that server1 is inherited from user
    const server1Entry = merged.find(e => e.key === 'mcpServers.server1')
    expect(server1Entry).toBeDefined()
    expect(server1Entry?.source.type).toBe('user')
    expect(server1Entry?.inherited).toBe(true)

    // Check that server2 is from project and not overridden
    const server2Entry = merged.find(e => e.key === 'mcpServers.server2')
    expect(server2Entry).toBeDefined()
    expect(server2Entry?.source.type).toBe('project')
    expect(server2Entry?.overridden).toBe(false)
  })

  it('handles empty project config', () => {
    const userConfig = {
      setting1: 'value1',
      mcpServers: {
        server1: { type: 'stdio' },
      },
    }
    const projectConfig = {}

    const merged = mergeConfigs(userConfig, projectConfig)

    // All entries should be from user and marked as inherited
    expect(merged).toHaveLength(2)
    merged.forEach(entry => {
      expect(entry.source.type).toBe('user')
      expect(entry.inherited).toBe(true)
    })
  })

  it('handles empty user config', () => {
    const userConfig = {}
    const projectConfig = {
      setting1: 'value1',
      mcpServers: {
        server1: { type: 'stdio' },
      },
    }

    const merged = mergeConfigs(userConfig, projectConfig)

    // All entries should be from project and not marked as overridden
    expect(merged).toHaveLength(2)
    merged.forEach(entry => {
      expect(entry.source.type).toBe('project')
      expect(entry.overridden).toBe(false)
    })
  })

  it('handles both configs empty', () => {
    const userConfig = {}
    const projectConfig = {}

    const merged = mergeConfigs(userConfig, projectConfig)

    expect(merged).toHaveLength(0)
  })

  it('merges nested configurations correctly', () => {
    const userConfig = {
      mcpServers: {
        server1: { type: 'stdio', command: 'node' },
        server2: { type: 'http', url: 'http://user.com' },
      },
    }
    const projectConfig = {
      mcpServers: {
        server2: { type: 'http', url: 'http://project.com' }, // Override server2
        server3: { type: 'ws', url: 'ws://project.com' }, // New server3
      },
    }

    const merged = mergeConfigs(userConfig, projectConfig)

    // Should have 3 entries: server1 (inherited), server2 (overridden), server3 (new)
    expect(merged).toHaveLength(3)

    const server1 = merged.find(e => e.key === 'mcpServers.server1')
    expect(server1?.inherited).toBe(true)
    expect(server1?.overridden).toBeUndefined()
    expect(server1?.value).toEqual({ type: 'stdio', command: 'node' })

    const server2 = merged.find(e => e.key === 'mcpServers.server2')
    expect(server2?.overridden).toBe(true)
    expect(server2?.value).toEqual({ type: 'http', url: 'http://project.com' })

    const server3 = merged.find(e => e.key === 'mcpServers.server3')
    expect(server3?.overridden).toBe(false)
    expect(server3?.value).toEqual({ type: 'ws', url: 'ws://project.com' })
  })
})
