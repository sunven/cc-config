import { describe, it, expect } from 'vitest'
import { trackConfigSource, getSourceHierarchy, findConflictingKeys } from '../sourceTracker'
import type { ConfigEntry } from '../../types'

describe('sourceTracker', () => {
  describe('trackConfigSource', () => {
    it('finds config entry by key', () => {
      const entries: ConfigEntry[] = [
        {
          key: 'test.key',
          value: 'test-value',
          source: { type: 'user', path: '/user/.claude.json', priority: 1 }
        }
      ]

      const result = trackConfigSource(entries, 'test.key')
      expect(result).toBeDefined()
      expect(result?.key).toBe('test.key')
    })

    it('returns undefined when key not found', () => {
      const entries: ConfigEntry[] = [
        {
          key: 'test.key',
          value: 'test-value',
          source: { type: 'user', path: '/user/.claude.json', priority: 1 }
        }
      ]

      const result = trackConfigSource(entries, 'other.key')
      expect(result).toBeUndefined()
    })
  })

  describe('getSourceHierarchy', () => {
    it('groups configs by source type', () => {
      const entries: ConfigEntry[] = [
        {
          key: 'user.key1',
          value: 'value1',
          source: { type: 'user', path: '/user/.claude.json', priority: 1 }
        },
        {
          key: 'user.key2',
          value: 'value2',
          source: { type: 'user', path: '/user/.claude.json', priority: 1 }
        },
        {
          key: 'project.key1',
          value: 'value3',
          source: { type: 'project', path: '/project/.mcp.json', priority: 2 }
        }
      ]

      const hierarchy = getSourceHierarchy(entries)
      expect(hierarchy.user).toHaveLength(2)
      expect(hierarchy.project).toHaveLength(1)
      expect(hierarchy.user).toContain('user.key1')
      expect(hierarchy.user).toContain('user.key2')
      expect(hierarchy.project).toContain('project.key1')
    })

    it('handles empty entries array', () => {
      const hierarchy = getSourceHierarchy([])
      expect(hierarchy).toEqual({})
    })
  })

  describe('findConflictingKeys', () => {
    it('identifies keys with multiple sources', () => {
      const entries: ConfigEntry[] = [
        {
          key: 'shared.key',
          value: 'user-value',
          source: { type: 'user', path: '/user/.claude.json', priority: 1 }
        },
        {
          key: 'shared.key',
          value: 'project-value',
          source: { type: 'project', path: '/project/.mcp.json', priority: 2 }
        }
      ]

      const conflicts = findConflictingKeys(entries)
      expect(conflicts).toContain('shared.key')
      expect(conflicts).toHaveLength(1)
    })

    it('returns empty array when no conflicts', () => {
      const entries: ConfigEntry[] = [
        {
          key: 'unique.key1',
          value: 'value1',
          source: { type: 'user', path: '/user/.claude.json', priority: 1 }
        },
        {
          key: 'unique.key2',
          value: 'value2',
          source: { type: 'project', path: '/project/.mcp.json', priority: 2 }
        }
      ]

      const conflicts = findConflictingKeys(entries)
      expect(conflicts).toHaveLength(0)
    })
  })
})
