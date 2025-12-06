import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigStore } from './configStore'
import { useProjectsStore } from './projectsStore'
import { useUIStore } from './uiStore'

describe('Zustand Stores', () => {
  describe('ConfigStore', () => {
    it('initializes with empty configs', () => {
      const { result } = renderHook(() => useConfigStore())
      expect(result.current.configs).toEqual({})
    })

    it('initializes with user scope', () => {
      const { result } = renderHook(() => useConfigStore())
      expect(result.current.scope).toBe('user')
    })

    it('updates scope correctly', () => {
      const { result } = renderHook(() => useConfigStore())

      act(() => {
        result.current.setScope('project')
      })
      expect(result.current.scope).toBe('project')

      act(() => {
        result.current.setScope('local')
      })
      expect(result.current.scope).toBe('local')
    })

    it('updates config entries', () => {
      const { result } = renderHook(() => useConfigStore())

      act(() => {
        result.current.updateConfig('testKey', 'testValue', 'user')
      })
      expect(result.current.configs).toHaveProperty('testKey')
      expect(result.current.configs.testKey.value).toBe('testValue')
      expect(result.current.configs.testKey.source.type).toBe('user')
    })

    it('clears configs', () => {
      const { result } = renderHook(() => useConfigStore())

      act(() => {
        result.current.updateConfig('key', 'value', 'user')
      })

      act(() => {
        result.current.clearConfigs()
      })
      expect(result.current.configs).toEqual({})
    })
  })

  describe('ProjectsStore', () => {
    it('initializes with empty projects', () => {
      const { result } = renderHook(() => useProjectsStore())
      expect(result.current.projects).toEqual([])
    })

    it('initializes with null activeProject', () => {
      const { result } = renderHook(() => useProjectsStore())
      expect(result.current.activeProject).toBeNull()
    })

    it('adds project correctly', () => {
      const { result } = renderHook(() => useProjectsStore())
      const project = {
        id: '1',
        name: 'Test Project',
        path: '/test/path',
        configPath: '/test/config'
      }

      act(() => {
        result.current.addProject(project)
      })
      expect(result.current.projects).toHaveLength(1)
      expect(result.current.projects[0]).toEqual(project)
    })

    it('sets active project', () => {
      const { result } = renderHook(() => useProjectsStore())
      const project = {
        id: '2',
        name: 'Active Project',
        path: '/active/path',
        configPath: '/active/config'
      }

      act(() => {
        result.current.setActiveProject(project)
      })
      expect(result.current.activeProject).toEqual(project)
    })

    it('removes project by id', () => {
      const { result } = renderHook(() => useProjectsStore())

      act(() => {
        result.current.addProject({
          id: '1',
          name: 'Test',
          path: '/test',
          configPath: '/config'
        })
      })

      act(() => {
        result.current.removeProject('1')
      })
      expect(result.current.projects).toHaveLength(0)
    })
  })

  describe('UIStore', () => {
    beforeEach(() => {
      // Reset UIStore state before each test
      useUIStore.setState({
        sidebarOpen: true,
        activeTab: 'user',
        theme: 'light'
      })
    })

    it('initializes with default values', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.sidebarOpen).toBe(true)
      expect(result.current.activeTab).toBe('user')
      expect(result.current.theme).toBe('light')
    })

    it('updates sidebar open state', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setSidebarOpen(false)
      })
      expect(result.current.sidebarOpen).toBe(false)
    })

    it('updates active tab', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setActiveTab('project')
      })
      expect(result.current.activeTab).toBe('project')
    })

    it('updates theme', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')
    })

    it('toggles theme', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
    })
  })
})
