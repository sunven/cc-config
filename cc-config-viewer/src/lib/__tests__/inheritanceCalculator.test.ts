import { describe, it, expect, beforeEach } from 'vitest'
import { calculateInheritance, calculateInheritanceChain, clearInheritanceCache } from '../inheritanceCalculator'

// Mock ConfigItem type for testing
interface ConfigItem {
  key: string
  value: any
}

describe('calculateInheritance', () => {
  it('should return empty arrays when both configs are empty', () => {
    const userConfigs: ConfigItem[] = []
    const projectConfigs: ConfigItem[] = []

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual([])
    expect(result.overridden).toEqual([])
    expect(result.projectSpecific).toEqual([])
  })

  it('should classify all project configs as project-specific when user config is empty', () => {
    const userConfigs: ConfigItem[] = []
    const projectConfigs: ConfigItem[] = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual([])
    expect(result.overridden).toEqual([])
    expect(result.projectSpecific).toEqual(projectConfigs)
  })

  it('should classify all user configs as inherited when project config is empty', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' }
    ]
    const projectConfigs: ConfigItem[] = []

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual(userConfigs)
    expect(result.overridden).toEqual([])
    expect(result.projectSpecific).toEqual([])
  })

  it('should classify matching values as inherited', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'key1', value: 'value1' }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'key1', value: 'value1' }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual(userConfigs)
    expect(result.overridden).toEqual([])
    expect(result.projectSpecific).toEqual([])
  })

  it('should classify different values as override', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'key1', value: 'user-value' }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'key1', value: 'project-value' }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual([])
    expect(result.overridden).toEqual([
      {
        key: 'key1',
        value: 'project-value',
        originalValue: 'user-value'
      }
    ])
    expect(result.projectSpecific).toEqual([])
  })

  it('should handle nested object comparison with deep equality', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'key1', value: { nested: { value: 'test' } } }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'key1', value: { nested: { value: 'test' } } }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual(userConfigs)
    expect(result.overridden).toEqual([])
    expect(result.projectSpecific).toEqual([])
  })

  it('should classify keys that exist only in project as project-specific', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'key1', value: 'value1' }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toEqual([{ key: 'key1', value: 'value1' }])
    expect(result.overridden).toEqual([])
    expect(result.projectSpecific).toEqual([{ key: 'key2', value: 'value2' }])
  })

  it('should handle mixed scenarios correctly', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'inherited1', value: 'val1' },
      { key: 'inherited2', value: 'val2' },
      { key: 'override1', value: 'user-val' },
      { key: 'common1', value: 'same-val' }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'inherited1', value: 'val1' },
      { key: 'override1', value: 'project-val' },
      { key: 'common1', value: 'same-val' },
      { key: 'project-only', value: 'project-val' }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    // inherited1 and common1 are inherited (same value), inherited2 is inherited (only in user)
    expect(result.inherited).toEqual([
      { key: 'inherited1', value: 'val1' },
      { key: 'common1', value: 'same-val' },
      { key: 'inherited2', value: 'val2' }
    ])

    // override1 is overridden (different values)
    expect(result.overridden).toEqual([
      {
        key: 'override1',
        value: 'project-val',
        originalValue: 'user-val'
      }
    ])

    // project-only is project-specific
    expect(result.projectSpecific).toEqual([
      { key: 'project-only', value: 'project-val' }
    ])
  })

  it('should achieve O(n) complexity using Map', () => {
    // Create large datasets
    const userConfigs: ConfigItem[] = Array.from({ length: 1000 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`
    }))
    const projectConfigs: ConfigItem[] = Array.from({ length: 1000 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`
    }))

    const start = performance.now()
    const result = calculateInheritance(userConfigs, projectConfigs)
    const end = performance.now()

    // Should complete in less than 50ms for O(n) complexity
    expect(end - start).toBeLessThan(50)
    expect(result.inherited).toHaveLength(1000)
  })

  it('should handle null and undefined values correctly', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'nullValue', value: null },
      { key: 'undefinedValue', value: undefined }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'nullValue', value: null }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toContainEqual({ key: 'undefinedValue', value: undefined })
    expect(result.inherited).toContainEqual({ key: 'nullValue', value: null })
  })

  it('should handle deeply nested objects with deep equality', () => {
    const userConfigs: ConfigItem[] = [
      {
        key: 'complex',
        value: {
          nested: {
            deep: {
              value: 'test',
              array: [1, 2, 3]
            }
          }
        }
      }
    ]
    const projectConfigs: ConfigItem[] = [
      {
        key: 'complex',
        value: {
          nested: {
            deep: {
              value: 'test',
              array: [1, 2, 3]
            }
          }
        }
      }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toHaveLength(1)
    expect(result.inherited[0].value).toEqual(userConfigs[0].value)
  })

  it('should handle arrays with deep equality', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'array1', value: [1, 2, 3] },
      { key: 'array2', value: ['a', 'b', 'c'] }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'array1', value: [1, 2, 3] },
      { key: 'array2', value: ['a', 'b'] }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toContainEqual({ key: 'array1', value: [1, 2, 3] })
    expect(result.overridden).toContainEqual({
      key: 'array2',
      value: ['a', 'b'],
      originalValue: ['a', 'b', 'c']
    })
  })

  it('should handle empty string values', () => {
    const userConfigs: ConfigItem[] = [
      { key: 'empty', value: '' },
      { key: 'space', value: ' ' }
    ]
    const projectConfigs: ConfigItem[] = [
      { key: 'empty', value: '' }
    ]

    const result = calculateInheritance(userConfigs, projectConfigs)

    expect(result.inherited).toContainEqual({ key: 'empty', value: '' })
    expect(result.inherited).toContainEqual({ key: 'space', value: ' ' })
  })
})

describe('calculateInheritanceChain', () => {
  beforeEach(() => {
    clearInheritanceCache()
  })

  it('should return inheritance chain with entries and resolved values', () => {
    const entries = [
      { key: 'key1', value: 'value1', source: { type: 'user', path: '/test' } },
      { key: 'key2', value: 42, source: { type: 'project', path: '/test' } }
    ]

    const result = calculateInheritanceChain(entries as any)

    expect(result.entries).toEqual(entries)
    expect(result.resolved).toEqual({ key1: 'value1', key2: 42 })
  })

  it('should return cached result on repeated calls with same input', () => {
    const entries = [
      { key: 'key1', value: 'value1', source: { type: 'user', path: '/test' } }
    ]

    const result1 = calculateInheritanceChain(entries as any)
    const result2 = calculateInheritanceChain(entries as any)

    expect(result1).toBe(result2) // Same reference (cached)
  })

  it('should return different result when entries change', () => {
    const entries1 = [
      { key: 'key1', value: 'value1', source: { type: 'user', path: '/test' } }
    ]
    const entries2 = [
      { key: 'key1', value: 'value2', source: { type: 'user', path: '/test' } }
    ]

    const result1 = calculateInheritanceChain(entries1 as any)
    const result2 = calculateInheritanceChain(entries2 as any)

    expect(result1.resolved.key1).toBe('value1')
    expect(result2.resolved.key1).toBe('value2')
  })

  it('should handle empty entries', () => {
    const result = calculateInheritanceChain([])

    expect(result.entries).toEqual([])
    expect(result.resolved).toEqual({})
  })

  it('should clear cache correctly', () => {
    const entries = [
      { key: 'key1', value: 'value1', source: { type: 'user', path: '/test' } }
    ]

    const result1 = calculateInheritanceChain(entries as any)
    clearInheritanceCache()
    const result2 = calculateInheritanceChain(entries as any)

    // Not same reference after cache clear (new object created)
    expect(result1).not.toBe(result2)
    expect(result1).toEqual(result2) // But same values
  })
})
