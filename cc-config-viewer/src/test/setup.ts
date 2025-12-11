import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { act } from '@testing-library/react'

// Mock ResizeObserver for cmdk (Command component)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock scrollIntoView for cmdk
Element.prototype.scrollIntoView = vi.fn()

// Mock matchMedia for accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock performance.memory for memory profiling tests (can be overridden by individual tests)
if (!('memory' in performance)) {
  Object.defineProperty(performance, 'memory', {
    writable: true,
    configurable: true,
    value: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50 MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100 MB
      jsHeapSizeLimit: 500 * 1024 * 1024, // 500 MB
    },
  })
}

// Mock Tauri APIs globally for all tests
// This prevents errors when components use Tauri functions in tests

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((cmd: string, _args?: unknown) => {
    // Default mock implementations for known commands
    switch (cmd) {
      case 'read_config':
        return Promise.resolve('{}')
      case 'parse_config':
        return Promise.resolve({})
      case 'get_project_root':
        return Promise.resolve('/mock/project/root')
      default:
        return Promise.resolve(null)
    }
  }),
}))

// Mock @tauri-apps/api/event
const mockListeners = new Map<string, Array<(event: unknown) => void>>()

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockImplementation((event: string, callback: (event: unknown) => void) => {
    // Store the callback for potential manual triggering in tests
    if (!mockListeners.has(event)) {
      mockListeners.set(event, [])
    }
    mockListeners.get(event)!.push(callback)

    // Return an unlisten function
    const unlisten = () => {
      const callbacks = mockListeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
    return Promise.resolve(unlisten)
  }),
  emit: vi.fn().mockImplementation((event: string, payload?: unknown) => {
    const callbacks = mockListeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb({ payload }))
    }
    return Promise.resolve()
  }),
}))

// Export helper for triggering mock events in tests (wrapped in act)
export const mockEmitEvent = (event: string, payload: unknown) => {
  act(() => {
    const callbacks = mockListeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb({ payload }))
    }
  })
}

// Clear mock listeners between tests
beforeEach(() => {
  mockListeners.clear()
})
