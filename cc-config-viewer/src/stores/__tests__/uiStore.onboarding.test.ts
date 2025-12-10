import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUiStore } from '../uiStore'

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

describe('uiStore - onboarding extensions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should have onboarding state fields', () => {
    const { result } = renderHook(() => useUiStore())

    expect(result.current.hasSeenOnboarding).toBeDefined()
    expect(result.current.isOnboardingActive).toBeDefined()
    expect(result.current.currentOnboardingStep).toBeDefined()
  })

  it('should initialize with default onboarding values', () => {
    const { result } = renderHook(() => useUiStore())

    expect(result.current.hasSeenOnboarding).toBe(false)
    expect(result.current.isOnboardingActive).toBe(false)
    expect(result.current.currentOnboardingStep).toBe(0)
  })

  it('should set onboarding active state', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setOnboardingActive(true)
    })

    expect(result.current.isOnboardingActive).toBe(true)
  })

  it('should set onboarding step', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setOnboardingStep(3)
    })

    expect(result.current.currentOnboardingStep).toBe(3)
  })

  it('should set hasSeenOnboarding', () => {
    const { result } = renderHook(() => useUiStore())

    expect(result.current.hasSeenOnboarding).toBe(false)

    act(() => {
      result.current.setHasSeenOnboarding(true)
    })

    expect(result.current.hasSeenOnboarding).toBe(true)
  })

  it('should complete onboarding', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.completeOnboarding()
    })

    expect(result.current.hasSeenOnboarding).toBe(true)
    expect(result.current.isOnboardingActive).toBe(false)
    expect(result.current.currentOnboardingStep).toBe(0)
  })

  it('should start onboarding', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.startOnboarding()
    })

    expect(result.current.isOnboardingActive).toBe(true)
    expect(result.current.currentOnboardingStep).toBe(0)
  })

  it('should persist hasSeenOnboarding to localStorage', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setHasSeenOnboarding(true)
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cc-config-onboarding',
      expect.any(String)
    )
  })

  it('should handle setHasSeenOnboarding with valid boolean', () => {
    const { result } = renderHook(() => useUiStore())

    act(() => {
      result.current.setHasSeenOnboarding(true)
    })

    expect(result.current.hasSeenOnboarding).toBe(true)
  })

  it('should reset onboarding state when starting fresh', () => {
    const { result } = renderHook(() => useUiStore())

    // Set some state
    act(() => {
      result.current.setOnboardingActive(true)
      result.current.setOnboardingStep(5)
    })

    expect(result.current.isOnboardingActive).toBe(true)
    expect(result.current.currentOnboardingStep).toBe(5)

    // Complete onboarding
    act(() => {
      result.current.completeOnboarding()
    })

    expect(result.current.isOnboardingActive).toBe(false)
    expect(result.current.currentOnboardingStep).toBe(0)
    expect(result.current.hasSeenOnboarding).toBe(true)
  })
})
