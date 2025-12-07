import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readConfigFile, parseConfigData, readConfig, parseConfig } from './tauriApi'

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'

describe('tauriApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('readConfigFile', () => {
    it('should read config file successfully', async () => {
      const mockContent = '{"key": "value"}'
      vi.mocked(invoke).mockResolvedValue(mockContent)

      const result = await readConfigFile('/path/to/config.json')

      expect(invoke).toHaveBeenCalledWith('read_config', { path: '/path/to/config.json' })
      expect(result).toBe(mockContent)
    })

    it('should handle filesystem errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Filesystem: 'File not found' })

      await expect(readConfigFile('/nonexistent.json')).rejects.toMatchObject({
        type: 'filesystem',
        message: expect.stringContaining('File system error'),
      })
    })

    it('should handle permission errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Permission: 'Access denied' })

      await expect(readConfigFile('/protected.json')).rejects.toMatchObject({
        type: 'permission',
        message: expect.stringContaining('Permission denied'),
      })
    })
  })

  describe('parseConfigData', () => {
    it('should parse config data successfully', async () => {
      const mockData = { key: 'value', nested: { foo: 'bar' } }
      vi.mocked(invoke).mockResolvedValue(mockData)

      const result = await parseConfigData('{"key": "value"}')

      expect(invoke).toHaveBeenCalledWith('parse_config', { content: '{"key": "value"}' })
      expect(result).toEqual(mockData)
    })

    it('should handle parse errors', async () => {
      vi.mocked(invoke).mockRejectedValue({ Parse: 'Invalid JSON' })

      await expect(parseConfigData('invalid json')).rejects.toMatchObject({
        type: 'parse',
        message: expect.stringContaining('Parse error'),
      })
    })

    it('should handle empty JSON object', async () => {
      const mockData = {}
      vi.mocked(invoke).mockResolvedValue(mockData)

      const result = await parseConfigData('{}')

      expect(result).toEqual({})
    })
  })

  describe('backwards compatibility', () => {
    it('readConfig should call readConfigFile', async () => {
      const mockContent = '{"test": true}'
      vi.mocked(invoke).mockResolvedValue(mockContent)

      const result = await readConfig('/path/to/config.json')

      expect(result).toBe(mockContent)
    })

    it('parseConfig should call parseConfigData', async () => {
      const mockData = { test: true }
      vi.mocked(invoke).mockResolvedValue(mockData)

      const result = await parseConfig('{"test": true}')

      expect(result).toEqual(mockData)
    })
  })

  describe('error conversion', () => {
    it('should convert unknown errors to filesystem type', async () => {
      vi.mocked(invoke).mockRejectedValue('Unknown error')

      await expect(readConfigFile('/test.json')).rejects.toMatchObject({
        type: 'filesystem',
        message: expect.stringContaining('Unknown error'),
      })
    })

    it('should preserve error details', async () => {
      const originalError = { Filesystem: 'Detailed error message' }
      vi.mocked(invoke).mockRejectedValue(originalError)

      await expect(readConfigFile('/test.json')).rejects.toMatchObject({
        details: originalError,
      })
    })
  })
})
