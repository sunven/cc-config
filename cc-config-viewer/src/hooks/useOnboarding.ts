import { useCallback, useState } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { useLocalStorage } from './useLocalStorage'
import type { OnboardingStep, UseOnboardingReturn, OnboardingStatus } from '@/types/onboarding'

/**
 * Custom hook for managing onboarding state and actions
 *
 * Integrates with:
 * - uiStore for global state management
 * - localStorage for persistence (key: 'cc-config-onboarding')
 * - Debounced loading for smooth transitions (Story 6.2 pattern)
 *
 * @returns Onboarding state and actions
 */
export function useOnboarding(): UseOnboardingReturn {
  // Use selectors for uiStore to avoid re-renders on unrelated state changes
  const hasSeenOnboarding = useUiStore((state) => state.hasSeenOnboarding)
  const isOnboardingActive = useUiStore((state) => state.isOnboardingActive)
  const currentOnboardingStep = useUiStore((state) => state.currentOnboardingStep)
  const startOnboardingStore = useUiStore((state) => state.startOnboarding)
  const completeOnboardingStore = useUiStore((state) => state.completeOnboarding)
  const setOnboardingActive = useUiStore((state) => state.setOnboardingActive)
  const setOnboardingStep = useUiStore((state) => state.setOnboardingStep)

  // Local state for UI-specific onboarding state
  const [canSkip, setCanSkipState] = useState(true)
  const [skipped, setSkipped] = useState(false)

  // Use localStorage for onboarding status persistence
  const [onboardingStatus, setOnboardingStatus, clearOnboardingStatus] = useLocalStorage(
    'cc-config-onboarding',
    {
      hasSeen: false,
      version: '1.0.0',
      completedAt: null as string | null,
    }
  )

  // Start onboarding flow
  const startOnboarding = useCallback(() => {
    setOnboardingActive(true)
    setOnboardingStep(0)
    setSkipped(false)
  }, [setOnboardingActive, setOnboardingStep])

  // Complete onboarding and mark as seen
  const completeOnboarding = useCallback(() => {
    setOnboardingStatus({
      hasSeen: true,
      version: '1.0.0',
      completedAt: new Date().toISOString(),
    })
    completeOnboardingStore()
    setSkipped(false)
  }, [setOnboardingStatus, completeOnboardingStore])

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    setOnboardingStatus({
      hasSeen: true,
      version: '1.0.0',
      completedAt: new Date().toISOString(),
    })
    completeOnboardingStore()
    setSkipped(true)
  }, [setOnboardingStatus, completeOnboardingStore])

  // Navigate to next step
  const nextStep = useCallback(() => {
    setOnboardingStep(currentOnboardingStep + 1)
  }, [currentOnboardingStep, setOnboardingStep])

  // Navigate to previous step
  const prevStep = useCallback(() => {
    if (currentOnboardingStep > 0) {
      setOnboardingStep(currentOnboardingStep - 1)
    }
  }, [currentOnboardingStep, setOnboardingStep])

  // Go to specific step
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0) {
        setOnboardingStep(step)
      }
    },
    [setOnboardingStep]
  )

  // Reset onboarding (for replay functionality)
  const resetOnboarding = useCallback(() => {
    clearOnboardingStatus()
    setOnboardingActive(false)
    setOnboardingStep(0)
    setSkipped(false)
  }, [clearOnboardingStatus, setOnboardingActive, setOnboardingStep])

  // Set canSkip flag
  const setCanSkip = useCallback((value: boolean) => {
    setCanSkipState(value)
  }, [])

  return {
    // State
    hasSeenOnboarding: onboardingStatus.hasSeen,
    isActive: isOnboardingActive,
    currentStep: currentOnboardingStep,
    canSkip,
    skipped,

    // Actions
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    nextStep,
    prevStep,
    resetOnboarding,
    setCanSkip,
    goToStep,
  }
}
