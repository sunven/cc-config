/**
 * Tests for externalEditorLauncher utility
 *
 * Part of Story 3.4 - Source Trace Functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectSystemEditor,
  openFileInEditor,
  openInVSCode,
  openInDefaultEditor,
  isValidFilePath,
  normalizeFilePath,
  getFileName,
  getDirectory,
} from './externalEditorLauncher'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('externalEditorLauncher', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValue(undefined)
  })

  describe('detectSystemEditor', () => {
    it('should return default editor in Tauri context', () => {
      const editor = detectSystemEditor()
      expect(editor).toBe('default')
    })
  })

  describe('openFileInEditor', () => {
    it('should call invoke with correct parameters', async () => {
      const { invoke } = await import('@tauri-apps/api/core')

      await openFileInEditor('/test/path/file.json', {
        editor: 'vscode',
        line_number: 42,
      })

      expect(invoke).toHaveBeenCalledWith('open_in_editor', {
        filePath: '/test/path/file.json',
        lineNumber: 42,
      })
    })

    it('should throw error when invoke fails', async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      vi.mocked(invoke).mockRejectedValue(new Error('Test error'))

      await expect(
        openFileInEditor('/test/path/file.json')
      ).rejects.toThrow('Failed to open file in editor')
    })
  })

  describe('openInVSCode', () => {
    it('should open file in VS Code', async () => {
      const { invoke } = await import('@tauri-apps/api/core')

      await openInVSCode('/test/path/file.json', 42)

      expect(invoke).toHaveBeenCalledWith('open_in_editor', {
        filePath: '/test/path/file.json',
        lineNumber: 42,
      })
    })
  })

  describe('openInDefaultEditor', () => {
    it('should open file in default editor', async () => {
      const { invoke } = await import('@tauri-apps/api/core')

      await openInDefaultEditor('/test/path/file.json')

      expect(invoke).toHaveBeenCalledWith('open_in_editor', {
        filePath: '/test/path/file.json',
        lineNumber: undefined,
      })
    })
  })

  describe('isValidFilePath', () => {
    it('should validate correct file paths', () => {
      expect(isValidFilePath('/home/user/file.txt')).toBe(true)
      expect(isValidFilePath('C:\\Users\\user\\file.txt')).toBe(true)
      expect(isValidFilePath('./relative/path/file.json')).toBe(true)
      expect(isValidFilePath('~/home/user/file.txt')).toBe(true)
    })

    it('should invalidate empty or invalid paths', () => {
      expect(isValidFilePath('')).toBe(false)
      expect(isValidFilePath(null as any)).toBe(false)
      expect(isValidFilePath(undefined as any)).toBe(false)
    })
  })

  describe('normalizeFilePath', () => {
    it('should expand home directory', () => {
      const result = normalizeFilePath('~/file.txt')
      expect(result).toBe(`${process.env.HOME || process.env.USERPROFILE || ''}/file.txt`)
    })

    it('should convert Windows backslashes to forward slashes', () => {
      const result = normalizeFilePath('C:\\Users\\user\\file.txt')
      expect(result).toBe('C:/Users/user/file.txt')
    })
  })

  describe('getFileName', () => {
    it('should extract file name from path', () => {
      expect(getFileName('/home/user/file.txt')).toBe('file.txt')
      expect(getFileName('./relative/path/file.json')).toBe('file.json')
      expect(getFileName('file.md')).toBe('file.md')
    })
  })

  describe('getDirectory', () => {
    it('should extract directory from path', () => {
      expect(getDirectory('/home/user/file.txt')).toBe('/home/user')
      expect(getDirectory('./relative/path/file.json')).toBe('./relative/path')
      expect(getDirectory('file.md')).toBe('/')
    })
  })
})