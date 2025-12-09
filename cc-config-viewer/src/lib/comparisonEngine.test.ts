import { describe, it, expect } from 'vitest'
import { calculateDiff, groupDiffsByStatus, getDiffSummary } from './comparisonEngine'
import type { Capability, DiffResult } from '../types/comparison'

describe('ComparisonEngine', () => {
  describe('calculateDiff', () => {
    it('calculates diff for matching capabilities', () => {
      const leftCapabilities: Capability[] = [
        {
          id: 'key1',
          key: 'key1',
          value: 'value1',
          source: 'left',
        },
        {
          id: 'key2',
          key: 'key2',
          value: 'value2',
          source: 'left',
        },
      ]

      const rightCapabilities: Capability[] = [
        {
          id: 'key1',
          key: 'key1',
          value: 'value1',
          source: 'right',
        },
        {
          id: 'key2',
          key: 'key2',
          value: 'value2',
          source: 'right',
        },
      ]

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('match')
      expect(result[1].status).toBe('match')
      expect(result[0].severity).toBe('low')
      expect(result[1].severity).toBe('low')
    })

    it('calculates diff for different values', () => {
      const leftCapabilities: Capability[] = [
        {
          id: 'key1',
          key: 'key1',
          value: 'value1',
          source: 'left',
        },
      ]

      const rightCapabilities: Capability[] = [
        {
          id: 'key1',
          key: 'key1',
          value: 'different_value',
          source: 'right',
        },
      ]

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('different')
      expect(result[0].severity).toBe('medium')
    })

    it('calculates diff for only-left capabilities', () => {
      const leftCapabilities: Capability[] = [
        {
          id: 'unique_left',
          key: 'unique_left',
          value: 'left_only',
          source: 'left',
        },
      ]

      const rightCapabilities: Capability[] = []

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('only-left')
      expect(result[0].leftValue?.id).toBe('unique_left')
      expect(result[0].rightValue).toBeUndefined()
    })

    it('calculates diff for only-right capabilities', () => {
      const leftCapabilities: Capability[] = []

      const rightCapabilities: Capability[] = [
        {
          id: 'unique_right',
          key: 'unique_right',
          value: 'right_only',
          source: 'right',
        },
      ]

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('only-right')
      expect(result[0].leftValue).toBeUndefined()
      expect(result[0].rightValue?.id).toBe('unique_right')
    })

    it('handles complex JSON values', () => {
      const leftCapabilities: Capability[] = [
        {
          id: 'complex',
          key: 'complex',
          value: { nested: { value: 123 }, array: [1, 2, 3] },
          source: 'left',
        },
      ]

      const rightCapabilities: Capability[] = [
        {
          id: 'complex',
          key: 'complex',
          value: { nested: { value: 123 }, array: [1, 2, 3] },
          source: 'right',
        },
      ]

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('match')
    })

    it('detects differences in complex JSON values', () => {
      const leftCapabilities: Capability[] = [
        {
          id: 'complex',
          key: 'complex',
          value: { nested: { value: 123 } },
          source: 'left',
        },
      ]

      const rightCapabilities: Capability[] = [
        {
          id: 'complex',
          key: 'complex',
          value: { nested: { value: 456 } },
          source: 'right',
        },
      ]

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('different')
    })

    it('optimizes for large datasets (100+ capabilities)', () => {
      const leftCapabilities: Capability[] = Array.from({ length: 150 }, (_, i) => ({
        id: `key${i}`,
        key: `key${i}`,
        value: `value${i}`,
        source: 'left',
      }))

      const rightCapabilities: Capability[] = Array.from({ length: 150 }, (_, i) => ({
        id: `key${i}`,
        key: `key${i}`,
        value: `value${i}`,
        source: 'right',
      }))

      const start = performance.now()
      const result = calculateDiff(leftCapabilities, rightCapabilities)
      const end = performance.now()

      expect(result).toHaveLength(150)
      expect(end - start).toBeLessThan(200) // Should complete within 200ms
    })

    it('assigns high severity to security-related capabilities', () => {
      const leftCapabilities: Capability[] = [
        {
          id: 'security_config',
          key: 'security.enabled',
          value: true,
          source: 'left',
        },
      ]

      const rightCapabilities: Capability[] = [
        {
          id: 'security_config',
          key: 'security.enabled',
          value: false,
          source: 'right',
        },
      ]

      const result = calculateDiff(leftCapabilities, rightCapabilities)

      expect(result[0].severity).toBe('high')
    })
  })

  describe('groupDiffsByStatus', () => {
    it('groups diff results correctly', () => {
      const diffs: DiffResult[] = [
        {
          capabilityId: 'match1',
          status: 'match',
          severity: 'low',
        },
        {
          capabilityId: 'diff1',
          status: 'different',
          severity: 'medium',
        },
        {
          capabilityId: 'left1',
          status: 'only-left',
          severity: 'medium',
        },
        {
          capabilityId: 'right1',
          status: 'only-right',
          severity: 'medium',
        },
        {
          capabilityId: 'match2',
          status: 'match',
          severity: 'low',
        },
      ]

      const grouped = groupDiffsByStatus(diffs)

      expect(grouped.matches).toHaveLength(2)
      expect(grouped.differences).toHaveLength(1)
      expect(grouped.onlyLeft).toHaveLength(1)
      expect(grouped.onlyRight).toHaveLength(1)
      expect(grouped.conflicts).toHaveLength(0)
    })
  })

  describe('getDiffSummary', () => {
    it('calculates summary statistics', () => {
      const diffs: DiffResult[] = [
        { capabilityId: '1', status: 'match', severity: 'low' },
        { capabilityId: '2', status: 'match', severity: 'low' },
        { capabilityId: '3', status: 'match', severity: 'low' },
        { capabilityId: '4', status: 'different', severity: 'medium' },
        { capabilityId: '5', status: 'only-left', severity: 'medium' },
      ]

      const summary = getDiffSummary(diffs)

      expect(summary.total).toBe(5)
      expect(summary.matches).toBe(3)
      expect(summary.differences).toBe(1)
      expect(summary.onlyLeft).toBe(1)
      expect(summary.onlyRight).toBe(0)
      expect(summary.matchPercentage).toBe(60) // 3/5 = 60%
    })

    it('handles empty diffs array', () => {
      const summary = getDiffSummary([])

      expect(summary.total).toBe(0)
      expect(summary.matches).toBe(0)
      expect(summary.matchPercentage).toBe(0)
    })
  })
})