/**
 * Test suite for statsCalculator utility (Story 3.5)
 *
 * Tests the statistics calculation for inheritance chain summary,
 * including counts, percentages, and quick stats.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { calculateStats, type InheritanceStats, type QuickStats } from './statsCalculator'
import type { InheritanceChainItem } from '../types/config'

describe('statsCalculator', () => {
  describe('calculateStats', () => {
    it('should calculate basic statistics correctly', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'test1',
          currentValue: 'value1',
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        },
        {
          configKey: 'test2',
          currentValue: 'value2',
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        },
        {
          configKey: 'test3',
          currentValue: 'value3',
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.totalCount).toBe(3)
      expect(stats.inherited.count).toBe(2)
      expect(stats.inherited.percentage).toBeCloseTo(66.67, 1)
      expect(stats.projectSpecific.count).toBe(1)
      expect(stats.projectSpecific.percentage).toBeCloseTo(33.33, 1)
      expect(stats.new.count).toBe(0)
      expect(stats.new.percentage).toBe(0)
    })

    it('should calculate percentages correctly for 100% inherited configs', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'test1',
          currentValue: 'value1',
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        },
        {
          configKey: 'test2',
          currentValue: 'value2',
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.inherited.percentage).toBe(100)
      expect(stats.projectSpecific.percentage).toBe(0)
      expect(stats.new.percentage).toBe(0)
    })

    it('should calculate percentages correctly for 100% project-specific configs', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'test1',
          currentValue: 'value1',
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        },
        {
          configKey: 'test2',
          currentValue: 'value2',
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.inherited.percentage).toBe(0)
      expect(stats.projectSpecific.percentage).toBe(100)
      expect(stats.new.percentage).toBe(0)
    })

    it('should identify most inherited MCP servers', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'mcpServers.key1',
          currentValue: { key: 'value1' },
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        },
        {
          configKey: 'mcpServers.key2',
          currentValue: { key: 'value2' },
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        },
        {
          configKey: 'mcpServers.key1',
          currentValue: { key: 'value1-modified' },
          classification: 'override',
          sourceType: 'inherited',
          isOverridden: true,
          originalValue: { key: 'value1' }
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.quickStats?.mostInheritedMcp).toBe('key1')
    })

    it('should identify most added agents', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'agents.key1',
          currentValue: { key: 'value1' },
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        },
        {
          configKey: 'agents.key2',
          currentValue: { key: 'value2' },
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        },
        {
          configKey: 'agents.key1',
          currentValue: { key: 'value1' },
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.quickStats?.mostAddedAgent).toBe('key1')
    })

    it('should handle empty inheritance chain', () => {
      const classifiedEntries: InheritanceChainItem[] = []

      const stats = calculateStats(classifiedEntries)

      expect(stats.totalCount).toBe(0)
      expect(stats.inherited.count).toBe(0)
      expect(stats.projectSpecific.count).toBe(0)
      expect(stats.new.count).toBe(0)
      expect(stats.inherited.percentage).toBe(0)
      expect(stats.projectSpecific.percentage).toBe(0)
      expect(stats.new.percentage).toBe(0)
      expect(stats.quickStats?.mostInheritedMcp).toBeUndefined()
      expect(stats.quickStats?.mostAddedAgent).toBeUndefined()
    })

    it('should handle classification as override', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'test1',
          currentValue: 'overridden-value',
          classification: 'override',
          sourceType: 'inherited',
          isOverridden: true,
          originalValue: 'original-value'
        }
      ]

      const stats = calculateStats(classifiedEntries)

      // Override should count as project-specific (new configuration)
      expect(stats.totalCount).toBe(1)
      expect(stats.projectSpecific.count).toBe(1)
      expect(stats.projectSpecific.percentage).toBe(100)
    })

    it('should calculate totals correctly', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'test1',
          currentValue: 'value1',
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        },
        {
          configKey: 'test2',
          currentValue: 'value2',
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        },
        {
          configKey: 'test3',
          currentValue: 'value3',
          classification: 'override',
          sourceType: 'inherited',
          isOverridden: true
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.totalCount).toBe(3)
      expect(stats.inherited.count).toBe(1)
      expect(stats.projectSpecific.count).toBe(2) // project-specific + override
      expect(stats.new.count).toBe(0)
    })

    it('should return complete QuickStats object', () => {
      const classifiedEntries: InheritanceChainItem[] = [
        {
          configKey: 'mcpServers.test',
          currentValue: { test: 'value' },
          classification: 'inherited',
          sourceType: 'inherited',
          isOverridden: false
        },
        {
          configKey: 'agents.test',
          currentValue: { test: 'value' },
          classification: 'project-specific',
          sourceType: 'project',
          isOverridden: false
        }
      ]

      const stats = calculateStats(classifiedEntries)

      expect(stats.quickStats).toBeDefined()
      expect(typeof stats.quickStats?.mostInheritedMcp).toBe('string')
      expect(typeof stats.quickStats?.mostAddedAgent).toBe('string')
    })

    it('should calculate statistics in less than 100ms (AC9 requirement)', () => {
      // Create a large dataset for performance testing
      const largeDataset: InheritanceChainItem[] = []
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          configKey: `test${i}`,
          currentValue: `value${i}`,
          classification: i % 2 === 0 ? 'inherited' : 'project-specific',
          sourceType: i % 2 === 0 ? 'inherited' : 'project',
          isOverridden: false
        })
      }

      const start = performance.now()
      const stats = calculateStats(largeDataset)
      const duration = performance.now() - start

      // AC9 requirement: Calculate and render summary < 100ms
      expect(duration).toBeLessThan(100)
      expect(stats.totalCount).toBe(1000)
    })

    it('should handle empty dataset quickly', () => {
      const start = performance.now()
      const stats = calculateStats([])
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10) // Should be very fast for empty data
      expect(stats.totalCount).toBe(0)
    })
  })
})