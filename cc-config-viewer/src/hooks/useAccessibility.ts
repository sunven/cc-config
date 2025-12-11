import { useState, useEffect, useCallback } from 'react'
import { useLiveRegion } from '@/components/Accessibility/LiveRegion'
import {
  highContrast,
  reduceMotion,
  screenReader,
  liveRegion,
} from '@/lib/accessibility'

export const useAccessibility = () => {
  const { announce } = useLiveRegion()
  const [isHighContrast, setIsHighContrast] = useState(highContrast.isEnabled())
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(reduceMotion.isEnabled())

  useEffect(() => {
    // Listen for high contrast changes
    const unsubscribeHighContrast = highContrast.onChange((enabled) => {
      setIsHighContrast(enabled)
      if (enabled) {
        announce('High contrast mode enabled', 'polite')
      }
    })

    // Listen for reduced motion changes
    const unsubscribeReducedMotion = reduceMotion.onChange((enabled) => {
      setPrefersReducedMotion(enabled)
    })

    return () => {
      unsubscribeHighContrast()
      unsubscribeReducedMotion()
    }
  }, [announce])

  const announceLoading = useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])

  const announceSuccess = useCallback((message: string) => {
    screenReader.announceSuccess(message)
  }, [])

  const announceError = useCallback((message: string) => {
    screenReader.announceError(message)
  }, [])

  const announceStateChange = useCallback((message: string) => {
    screenReader.announceStateChange(message)
  }, [])

  const toggleHighContrast = useCallback(() => {
    const newValue = !isHighContrast
    setIsHighContrast(newValue)
    // Toggle high contrast class on document body
    document.body.classList.toggle('high-contrast', newValue)
    announce(newValue ? 'High contrast mode enabled' : 'High contrast mode disabled', 'polite')
  }, [isHighContrast, announce])

  return {
    isHighContrast,
    prefersReducedMotion,
    announceLoading,
    announceSuccess,
    announceError,
    announceStateChange,
    toggleHighContrast,
  }
}

export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsFocusVisible(true)
      }
    }

    const handleMouseDown = () => {
      setIsFocusVisible(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isFocusVisible
}

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(reduceMotion.isEnabled())

  useEffect(() => {
    const unsubscribe = reduceMotion.onChange((enabled) => {
      setPrefersReducedMotion(enabled)
    })

    return unsubscribe
  }, [])

  const shouldReduceMotion = useCallback((animationDuration: number = 300) => {
    return prefersReducedMotion ? 0 : animationDuration
  }, [prefersReducedMotion])

  return {
    prefersReducedMotion,
    shouldReduceMotion,
  }
}
