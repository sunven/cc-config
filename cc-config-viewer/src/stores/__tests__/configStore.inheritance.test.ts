import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from '../configStore'

// Mock the calculateInheritance function
vi.mock('../../lib/inheritanceCalculator', () => ({
  calculateInheritance: vi.fn(),
}))

import { calculateInheritance } from '../../lib/inheritanceCalculator'

describe('ConfigStore - Inheritance Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useConfigStore.setState({
      inheritanceMap: new Map(),
      configs: [],
      userConfigsCache: null,
      projectConfigsCache: {},
    })
  })

  it('should update inheritance map when updateInheritanceChain is called', () => {
    const { result } = renderHook(() => useConfigStore())

    const userConfigs = [
      { key: 'key1', value: 'value1', source: { type: 'user', path: '~/.claude.json', priority: 1 } },
      { key: 'key2', value: 'value2', source: { type: 'user', path: '~/.claude.json', priority: 1 } },
    ]

    const projectConfigs = [
      { key: 'key1', value: 'value1', source: { type: 'project', path: './.mcp.json', priority: 2 } },
      { key: 'key2', value: 'different', source: { type: 'project', path: './.mcp.json', priority: 2 } },
      { key: 'key3', value: 'value3', source: { type: 'project', path: './.mcp.json', priority: 2 } },
    ]

    // Mock calculateInheritance to return classification results
    ;(calculateInheritance as vi.MockedFunction<typeof calculateInheritance>).mockReturnValue({
      inherited: [{ key: 'key1', value: 'value1' }],
      overridden: [{ key: 'key2', value: 'different', originalValue: 'value2' }],
      projectSpecific: [{ key: 'key3', value: 'value3' }],
    })

    act(() => {
      result.current.updateInheritanceChain(userConfigs, projectConfigs)
    })

    const inheritanceMap = result.current.inheritanceMap

    expect(inheritanceMap.size).toBe(3)

    // Check inherited config
    const inherited = inheritanceMap.get('key1')
    expect(inherited).toEqual({
      configKey: 'key1',
      currentValue: 'value1',
      classification: 'inherited',
      sourceType: 'project',
      inheritedFrom: '~/.claude.json',
      isOverridden: false,
    })

    // Check overridden config
    const overridden = inheritanceMap.get('key2')
    expect(overridden).toEqual({
      configKey: 'key2',
      currentValue: 'different',
      classification: 'override',
      sourceType: 'project',
      originalValue: 'value2',
      isOverridden: true,
    })

    // Check project-specific config
    const projectSpecific = inheritanceMap.get('key3')
    expect(projectSpecific).toEqual({
      configKey: 'key3',
      currentValue: 'value3',
      classification: 'project-specific',
      sourceType: 'project',
      isOverridden: false,
    })
  })

  it('should handle empty user and project configs', () => {
    const { result } = renderHook(() => useConfigStore())

    const userConfigs: any[] = []
    const projectConfigs: any[] = []

    ;(calculateInheritance as vi.MockedFunction<typeof calculateInheritance>).mockReturnValue({
      inherited: [],
      overridden: [],
      projectSpecific: [],
    })

    act(() => {
      result.current.updateInheritanceChain(userConfigs, projectConfigs)
    })

    expect(result.current.inheritanceMap.size).toBe(0)
  })

  it('should call calculateInheritance with correct parameters', () => {
    const { result } = renderHook(() => useConfigStore())

    const userConfigs = [
      { key: 'key1', value: 'value1', source: { type: 'user', path: '~/.claude.json', priority: 1 } },
    ]

    const projectConfigs = [
      { key: 'key1', value: 'value1', source: { type: 'project', path: './.mcp.json', priority: 2 } },
    ]

    ;(calculateInheritance as vi.MockedFunction<typeof calculateInheritance>).mockReturnValue({
      inherited: [{ key: 'key1', value: 'value1' }],
      overridden: [],
      projectSpecific: [],
    })

    act(() => {
      result.current.updateInheritanceChain(userConfigs, projectConfigs)
    })

    expect(calculateInheritance).toHaveBeenCalledWith(
      [{ key: 'key1', value: 'value1' }],
      [{ key: 'key1', value: 'value1' }]
    )
  })

  it('should update view mode when setViewMode is called', () => {
    const { result } = renderHook(() => useConfigStore())

    expect(result.current.viewMode).toBe('merged')

    act(() => {
      result.current.setViewMode('split')
    })

    expect(result.current.viewMode).toBe('split')

    act(() => {
      result.current.setViewMode('merged')
    })

    expect(result.current.viewMode).toBe('merged')
  })
})
