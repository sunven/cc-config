import {
  categorizeDifferences,
  getHighlightClass,
  calculateSummaryStats,
  filterDifferences,
  getSeverityFromCapability,
  categorizeDifferencesOptimized,
  validateHighlightFilters,
} from './highlightEngine'
import type { DiffResult, HighlightFilters } from '../types/comparison'

describe('highlightEngine', () => {
  describe('getHighlightClass', () => {
    it('should return blue highlighting for only-left status', () => {
      expect(getHighlightClass('only-left')).toBe('bg-blue-100 text-blue-800')
    })

    it('should return green highlighting for only-right status', () => {
      expect(getHighlightClass('only-right')).toBe('bg-green-100 text-green-800')
    })

    it('should return yellow highlighting for different status', () => {
      expect(getHighlightClass('different')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return yellow highlighting for conflict status', () => {
      expect(getHighlightClass('conflict')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return empty string for match status', () => {
      expect(getHighlightClass('match')).toBe('')
    })

    it('should return empty string for unknown status', () => {
      expect(getHighlightClass('unknown')).toBe('')
    })
  })

  describe('categorizeDifferences', () => {
    it('should add highlightClass to diff results', () => {
      const diffResults: DiffResult[] = [
        {
          capabilityId: 'cap1',
          status: 'only-left',
          severity: 'medium',
        },
        {
          capabilityId: 'cap2',
          status: 'only-right',
          severity: 'medium',
        },
        {
          capabilityId: 'cap3',
          status: 'different',
          severity: 'medium',
        },
        {
          capabilityId: 'cap4',
          status: 'match',
          severity: 'low',
        },
      ]

      const result = categorizeDifferences(diffResults)

      expect(result[0].highlightClass).toBe('bg-blue-100 text-blue-800')
      expect(result[1].highlightClass).toBe('bg-green-100 text-green-800')
      expect(result[2].highlightClass).toBe('bg-yellow-100 text-yellow-800')
      expect(result[3].highlightClass).toBe('')
    })

    it('should preserve existing properties', () => {
      const diffResults: DiffResult[] = [
        {
          capabilityId: 'cap1',
          status: 'only-left',
          severity: 'medium',
          leftValue: { id: 'cap1', key: 'cap1', value: 'value1', source: 'left' },
        },
      ]

      const result = categorizeDifferences(diffResults)

      expect(result[0].capabilityId).toBe('cap1')
      expect(result[0].status).toBe('only-left')
      expect(result[0].severity).toBe('medium')
      expect(result[0].leftValue).toEqual({ id: 'cap1', key: 'cap1', value: 'value1', source: 'left' })
    })

    it('should handle empty array', () => {
      const result = categorizeDifferences([])
      expect(result).toEqual([])
    })
  })

  describe('calculateSummaryStats', () => {
    it('should calculate summary statistics correctly', () => {
      const diffResults: DiffResult[] = [
        { capabilityId: 'cap1', status: 'only-left', severity: 'medium' },
        { capabilityId: 'cap2', status: 'only-right', severity: 'medium' },
        { capabilityId: 'cap3', status: 'different', severity: 'medium' },
        { capabilityId: 'cap4', status: 'match', severity: 'low' },
        { capabilityId: 'cap5', status: 'only-left', severity: 'medium' },
      ]

      const result = calculateSummaryStats(diffResults)

      expect(result.totalDifferences).toBe(4) // 2 only-left + 1 only-right + 1 different
      expect(result.onlyInA).toBe(2)
      expect(result.onlyInB).toBe(1)
      expect(result.differentValues).toBe(1)
    })

    it('should handle only matches', () => {
      const diffResults: DiffResult[] = [
        { capabilityId: 'cap1', status: 'match', severity: 'low' },
        { capabilityId: 'cap2', status: 'match', severity: 'low' },
      ]

      const result = calculateSummaryStats(diffResults)

      expect(result.totalDifferences).toBe(0)
      expect(result.onlyInA).toBe(0)
      expect(result.onlyInB).toBe(0)
      expect(result.differentValues).toBe(0)
    })

    it('should handle empty array', () => {
      const result = calculateSummaryStats([])
      expect(result.totalDifferences).toBe(0)
      expect(result.onlyInA).toBe(0)
      expect(result.onlyInB).toBe(0)
      expect(result.differentValues).toBe(0)
    })

    it('should handle conflicts', () => {
      const diffResults: DiffResult[] = [
        { capabilityId: 'cap1', status: 'conflict', severity: 'medium' },
      ]

      const result = calculateSummaryStats(diffResults)

      expect(result.totalDifferences).toBe(1)
      expect(result.differentValues).toBe(1)
    })
  })

  describe('filterDifferences', () => {
    let diffResults: DiffResult[]

    beforeEach(() => {
      diffResults = [
        { capabilityId: 'cap1', status: 'only-left', severity: 'medium' },
        { capabilityId: 'cap2', status: 'only-right', severity: 'medium' },
        { capabilityId: 'cap3', status: 'different', severity: 'medium' },
        { capabilityId: 'cap4', status: 'match', severity: 'low' },
      ]
    })

    it('should filter to show only differences when showOnlyDifferences is true', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: true,
        showBlueOnly: true,
        showGreenOnly: true,
        showYellowOnly: true,
      }

      const result = filterDifferences(diffResults, filters)

      expect(result).toHaveLength(3)
      expect(result.map((d) => d.capabilityId)).toEqual(['cap1', 'cap2', 'cap3'])
    })

    it('should show all capabilities when showOnlyDifferences is false', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: false,
        showBlueOnly: true,
        showGreenOnly: true,
        showYellowOnly: true,
      }

      const result = filterDifferences(diffResults, filters)

      expect(result).toHaveLength(4)
    })

    it('should filter by individual toggle (blue only)', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: false,
        showBlueOnly: true,
        showGreenOnly: false,
        showYellowOnly: false,
      }

      const result = filterDifferences(diffResults, filters)

      expect(result).toHaveLength(1)
      expect(result[0].capabilityId).toBe('cap1')
    })

    it('should filter by individual toggle (green only)', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: false,
        showBlueOnly: false,
        showGreenOnly: true,
        showYellowOnly: false,
      }

      const result = filterDifferences(diffResults, filters)

      expect(result).toHaveLength(1)
      expect(result[0].capabilityId).toBe('cap2')
    })

    it('should filter by individual toggle (yellow only)', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: false,
        showBlueOnly: false,
        showGreenOnly: false,
        showYellowOnly: true,
      }

      const result = filterDifferences(diffResults, filters)

      expect(result).toHaveLength(1)
      expect(result[0].capabilityId).toBe('cap3')
    })

    it('should handle showOnlyDifferences with individual toggles', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: true,
        showBlueOnly: true,
        showGreenOnly: false,
        showYellowOnly: true,
      }

      const result = filterDifferences(diffResults, filters)

      expect(result).toHaveLength(2) // cap1 (only-left) and cap3 (different)
      expect(result.map((d) => d.capabilityId)).toEqual(['cap1', 'cap3'])
    })
  })

  describe('getSeverityFromCapability', () => {
    it('should return high severity for security configurations', () => {
      expect(
        getSeverityFromCapability({ key: 'securitySetting', source: 'user' })
      ).toBe('high')
      expect(
        getSeverityFromCapability({ key: 'authConfig', source: 'project' })
      ).toBe('high')
    })

    it('should return medium severity for project-level configs', () => {
      expect(
        getSeverityFromCapability({ key: 'projectSetting', source: 'project' })
      ).toBe('medium')
    })

    it('should return medium severity by default', () => {
      expect(
        getSeverityFromCapability({ key: 'regularSetting', source: 'user' })
      ).toBe('medium')
    })
  })

  describe('categorizeDifferencesOptimized', () => {
    it('should categorize differences with performance tracking', () => {
      const diffResults: DiffResult[] = [
        { capabilityId: 'cap1', status: 'only-left', severity: 'medium' },
        { capabilityId: 'cap2', status: 'only-right', severity: 'medium' },
      ]

      const result = categorizeDifferencesOptimized(diffResults)

      expect(result[0].highlightClass).toBe('bg-blue-100 text-blue-800')
      expect(result[1].highlightClass).toBe('bg-green-100 text-green-800')
    })

    it('should handle empty array', () => {
      const result = categorizeDifferencesOptimized([])
      expect(result).toEqual([])
    })
  })

  describe('validateHighlightFilters', () => {
    it('should validate correct filters', () => {
      const filters: HighlightFilters = {
        showOnlyDifferences: true,
        showBlueOnly: false,
        showGreenOnly: true,
        showYellowOnly: false,
      }

      const result = validateHighlightFilters(filters)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should return errors for invalid filters', () => {
      const filters = {
        showOnlyDifferences: 'true' as any, // Should be boolean
        showBlueOnly: false,
        showGreenOnly: true,
        showYellowOnly: false,
      }

      const result = validateHighlightFilters(filters)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('showOnlyDifferences must be a boolean')
    })
  })
})