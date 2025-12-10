import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOnboarding } from '../useOnboarding'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with hasSeenOnboarding as false', () => {
    const { result } = renderHook(() => useOnboarding())

    expect(result.current.hasSeenOnboarding).toBe(false)
    expect(result.current.isActive).toBe(false)
    expect(result.current.currentStep).toBe(0)
  })

  it('should load hasSeenOnboarding from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        hasSeen: true,
        version: '1.0.0',
        completedAt: '2025-12-10T00:00:00.000Z',
      })
    )

    const { result } = renderHook(() => useOnboarding())

    expect(result.current.hasSeenOnboarding).toBe(true)
  })

  it('should start onboarding and set isActive to true', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => {
      result.current.startOnboarding()
    })

    expect(result.current.isActive).toBe(true)
  })

  it('should complete onboarding and update localStorage', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => {
      result.current.startOnboarding()
    })

    act(() => {
      result.current.completeOnboarding()
    })

    expect(result.current.hasSeenOnboarding).toBe(true)
    expect(result.current.isActive).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cc-config-onboarding',
      expect.stringContaining('hasSeen')
    )
  })

  it('should skip onboarding', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => {
      result.current.skipOnboarding()
    })

    expect(result.current.hasSeenOnboarding).toBe(true)
    expect(result.current.isActive).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('should increment current step', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => {
      result.current.startOnboarding()
    })

    expect(result.current.currentStep).toBe(0)

    act(() => {
      result.current.nextStep()
    })

    expect(result.current.currentStep).toBe(1)
  })

  it('should decrement current step', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => {
      result.current.startOnboarding()
    })

    act(() => {
      result.current.nextStep()
    })
    act(() => {
      result.current.nextStep()
    })

    expect(result.current.currentStep).toBe(2)

    act(() => {
      result.current.prevStep()
    })

    expect(result.current.currentStep).toBe(1)
  })

  it('should not go below step 0', () => {
    const { result } = renderHook(() => useOnboarding())

    act(() => {
      result.current.startOnboarding()
    })

    act(() => {
      result.current.prevStep()
    })

    expect(result.current.currentStep).toBe(0)
  })

  it('should reset onboarding for replay', () => {
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        hasSeen: true,
        version: '1.0.0',
      })
    )

    const { result } = renderHook(() => useOnboarding())

    expect(result.current.hasSeenOnboarding).toBe(true)

    act(() => {
      result.current.resetOnboarding()
    })

    expect(result.current.hasSeenOnboarding).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cc-config-onboarding')
  })

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })

    const { result } = renderHook(() => useOnboarding())

    expect(result.current.hasSeenOnboarding).toBe(false)
    expect(result.current.isActive).toBe(false)
  })

  it('should check if onboarding can skip', () => {
    const { result } = renderHook(() => useOnboarding())

    expect(result.current.canSkip).toBe(true)

    act(() => {
      result.current.setCanSkip(false)
    })

    expect(result.current.canSkip).toBe(false)
  })
})
