/**
 * Tests for sourceTracker utility
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SourceTracker, sourceTracker, traceSourceWithDefaults, formatSourceLocation } from './sourceTracker'
import * as tauriCore from '@tauri-apps/api/core'

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('SourceTracker', () => {
  let tracker: SourceTracker

  beforeEach(() => {
    tracker = new SourceTracker()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with empty cache', () => {
      expect(tracker.getCacheStats().size).toBe(0)
    })

    it('should have tracking enabled by default', () => {
      expect(tracker.isTrackingEnabled()).toBe(true)
    })
  })

  describe('isTrackingEnabled', () => {
    it('should return tracking state', () => {
      expect(tracker.isTrackingEnabled()).toBe(true)
    })
  })

  describe('setTrackingEnabled', () => {
    it('should enable tracking', () => {
      tracker.setTrackingEnabled(false)
      expect(tracker.isTrackingEnabled()).toBe(false)
    })

    it('should clear cache when disabled', () => {
      // Manually add to cache
      const cache = (tracker as any).cache
      cache.set('test', { location: { file_path: '/test' }, timestamp: Date.now() })

      tracker.setTrackingEnabled(false)
      expect(cache.size).toBe(0)
    })
  })

  describe('traceSource', () => {
    it('should return null when tracking is disabled', async () => {
      tracker.setTrackingEnabled(false)

      const result = await tracker.traceSource('testKey', ['/test/path'])
      expect(result).toBeNull()
    })

    it('should call invoke with correct parameters', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      const result = await tracker.traceSource('testKey', ['/test/path'])

      expect(mockInvoke).toHaveBeenCalledWith('get_source_location', {
        request: {
          config_key: 'testKey',
          search_paths: ['/test/path'],
        },
      })

      expect(result).toEqual({
        file_path: '/test/file.json',
        line_number: 42,
      })
    })

    it('should cache successful results', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey', ['/test/path'])
      const cached = tracker.getCachedLocation('testKey')

      expect(cached).toEqual({
        file_path: '/test/file.json',
        line_number: 42,
      })
    })

    it('should return null when source not found', async () => {
      const mockInvoke = vi.fn().mockResolvedValue(null)
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      const result = await tracker.traceSource('testKey', ['/test/path'])
      expect(result).toBeNull()
    })

    it('should throw error on invoke failure', async () => {
      const mockInvoke = vi.fn().mockRejectedValue(new Error('Test error'))
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await expect(
        tracker.traceSource('testKey', ['/test/path'])
      ).rejects.toThrow('Source tracing failed')
    })
  })

  describe('getCachedLocation', () => {
    it('should return undefined for non-existent keys', () => {
      const result = tracker.getCachedLocation('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should return cached location for valid entries', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey', ['/test/path'])
      const result = tracker.getCachedLocation('testKey')

      expect(result).toEqual({
        file_path: '/test/file.json',
        line_number: 42,
      })
    })

    it('should return undefined for expired cache', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey', ['/test/path'])

      // Expire the cache
      const cache = (tracker as any).cache
      const entry = cache.get('testKey')
      entry.timestamp = Date.now() - (15 * 60 * 1000) // 15 minutes ago

      const result = tracker.getCachedLocation('testKey')
      expect(result).toBeUndefined()
    })
  })

  describe('clearCache', () => {
    it('should clear all cached entries', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey', ['/test/path'])
      expect(tracker.getCacheStats().size).toBe(1)

      tracker.clearCache()
      expect(tracker.getCacheStats().size).toBe(0)
    })
  })

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey1', ['/test/path'])
      await tracker.traceSource('testKey2', ['/test/path'])

      const stats = tracker.getCacheStats()
      expect(stats.size).toBe(2)
      expect(stats.entries).toContain('testKey1')
      expect(stats.entries).toContain('testKey2')
    })
  })

  describe('invalidate', () => {
    it('should remove specific cache entry', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey', ['/test/path'])
      expect(tracker.hasCached('testKey')).toBe(true)

      tracker.invalidate('testKey')
      expect(tracker.hasCached('testKey')).toBe(false)
    })
  })

  describe('hasCached', () => {
    it('should return true for cached entries', async () => {
      const mockInvoke = vi.fn().mockResolvedValue({
        file_path: '/test/file.json',
        line_number: 42,
      })
      vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

      await tracker.traceSource('testKey', ['/test/path'])
      expect(tracker.hasCached('testKey')).toBe(true)
    })

    it('should return false for non-cached entries', () => {
      expect(tracker.hasCached('testKey')).toBe(false)
    })
  })
})

describe('traceSourceWithDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the tracker cache
    sourceTracker.clearCache()
  })

  it('should use default paths with project', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      file_path: '/test/file.json',
      line_number: 42,
    })
    vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

    await traceSourceWithDefaults('testKey', '/test/project')

    expect(mockInvoke).toHaveBeenCalled()
    const callArgs = mockInvoke.mock.calls[0][1]
    const request = callArgs.request

    expect(request.search_paths.length).toBe(3)
    expect(request.search_paths[0]).toContain('.claude.json')
    expect(request.search_paths[1]).toContain('.mcp.json')
    expect(request.search_paths[2]).toContain('.claude/settings.json')
  })

  it('should use default paths without project', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      file_path: '/test/file.json',
      line_number: 42,
    })
    vi.mocked(tauriCore.invoke).mockImplementation(mockInvoke)

    await traceSourceWithDefaults('testKey')

    expect(mockInvoke).toHaveBeenCalled()
  })
})

describe('formatSourceLocation', () => {
  it('should format location with line number', () => {
    const homePath = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\sunven'
    const fullPath = `${homePath}\\.claude.json`

    const result = formatSourceLocation({
      file_path: fullPath,
      line_number: 42,
    })

    expect(result.displayPath).toBe('~\\.claude.json')
    expect(result.displayLine).toBe('line 42')
  })

  it('should format location without line number', () => {
    const homePath = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\sunven'
    const fullPath = `${homePath}\\.claude.json`

    const result = formatSourceLocation({
      file_path: fullPath,
    })

    expect(result.displayPath).toBe('~\\.claude.json')
    expect(result.displayLine).toBeNull()
  })

  it('should not expand path if not in home directory', () => {
    const result = formatSourceLocation({
      file_path: '/other/path/file.json',
      line_number: 10,
    })

    expect(result.displayPath).toBe('/other/path/file.json')
    expect(result.displayLine).toBe('line 10')
  })
})