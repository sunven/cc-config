/**
 * Tests for pathHighlighter utility
 */

import { describe, it, expect } from 'vitest'
import { getHighlightStyle, highlightPath, clearHighlight } from './pathHighlighter'
import type { HighlightStyle } from '../types/inheritance'
import type { ConfigEntry } from '../types/config'

const mockConfigs: ConfigEntry[] = [
  {
    key: 'test.config',
    value: 'project-value',
    source: {
      type: 'project',
      path: './.mcp.json',
      priority: 2
    }
  }
]

describe('pathHighlighter utility', () => {
  it('should get appropriate highlight style for different configurations', () => {
    const userStyle = getHighlightStyle('user')
    const projectStyle = getHighlightStyle('project')
    const inheritedStyle = getHighlightStyle('inherited')

    expect(userStyle.color).toBe('#3B82F6') // Blue
    expect(projectStyle.color).toBe('#10B981') // Green
    expect(inheritedStyle.color).toBe('#6B7280') // Gray
  })

  it('should support different intensity levels', () => {
    const lowIntensity = getHighlightStyle('user', 'low')
    const mediumIntensity = getHighlightStyle('user', 'medium')
    const highIntensity = getHighlightStyle('user', 'high')

    expect(lowIntensity.intensity).toBe('low')
    expect(mediumIntensity.intensity).toBe('medium')
    expect(highIntensity.intensity).toBe('high')
  })

  it('should enable animations when specified', () => {
    const withAnimation = getHighlightStyle('user', 'medium', true)
    const withoutAnimation = getHighlightStyle('user', 'medium', false)

    expect(withAnimation.animation).toBe(true)
    expect(withoutAnimation.animation).toBe(false)
  })

  it('should highlight a path for a given config key', () => {
    const highlighted = highlightPath(mockConfigs, 'test.config')

    expect(highlighted).toHaveLength(1)
    expect(highlighted[0].key).toBe('test.config')
    expect(highlighted[0].highlighted).toBe(true)
  })

  it('should return all configs when configKey is null', () => {
    const highlighted = highlightPath(mockConfigs, null)

    expect(highlighted).toHaveLength(mockConfigs.length)
    highlighted.forEach(item => {
      expect(item.highlighted).toBe(false)
    })
  })

  it('should clear all highlights', () => {
    const initiallyHighlighted = highlightPath(mockConfigs, 'test.config')
    const cleared = clearHighlight(initiallyHighlighted)

    expect(cleared.every(item => !item.highlighted)).toBe(true)
  })
})