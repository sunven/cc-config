/**
 * Debounced loading hook with 200ms threshold
 *
 * This hook prevents UI flashing for operations that complete quickly (<200ms)
 * while showing loading states for longer operations.
 */

import React, { useState, useCallback, useRef } from 'react'
import { useUiStore } from '../stores/uiStore'

interface UseDebouncedLoadingOptions {
  delay?: number
  immediate?: boolean
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface UseDebouncedLoadingReturn {
  isLoading: boolean
  loadingMessage: string | null
  startLoading: (message: string, operation?: () => Promise<any>) => Promise<any>
  stopLoading: () => void
  setLoadingMessage: (message: string | null) => void
  clearTimeout: () => void
}

/**
 * Custom hook for debounced loading state management
 *
 * @param delay - Debounce delay in milliseconds (default: 200)
 * @param immediate - Whether to show loading immediately (default: false)
 * @param onComplete - Callback when operation completes
 * @param onError - Callback when operation errors
 * @returns Loading state and control functions
 */
export function useDebouncedLoading(
  options: UseDebouncedLoadingOptions = {}
): UseDebouncedLoadingReturn {
  const {
    delay = 200,
    immediate = false,
    onComplete,
    onError,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const operationRef = useRef<(() => Promise<any>) | null>(null)

  // Clear any pending timeout
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Stop loading and clear state
  const stopLoading = useCallback(() => {
    clearTimeout()
    setIsLoading(false)
    setLoadingMessage(null)
    operationRef.current = null
  }, [clearTimeout])

  // Start loading with debounce
  const startLoading = useCallback(
    async (message: string, operation?: () => Promise<any>): Promise<any> => {
      // Store the operation
      operationRef.current = operation || null

      // Set the loading message immediately
      setLoadingMessage(message)

      // If immediate mode, show loading state right away
      if (immediate) {
        setIsLoading(true)
      } else {
        // Set timeout to show loading state after delay
        timeoutRef.current = setTimeout(() => {
          setIsLoading(true)
        }, delay)
      }

      try {
        // Execute operation if provided
        if (operation) {
          const result = await operation()

          // Stop loading on success
          stopLoading()

          // Call completion callback
          if (onComplete) {
            onComplete()
          }

          return result
        }

        // If no operation, return a function to manually stop loading
        return stopLoading
      } catch (error) {
        // Stop loading on error
        stopLoading()

        // Call error callback
        if (onError && error instanceof Error) {
          onError(error)
        }

        throw error
      }
    },
    [delay, immediate, onComplete, onError, stopLoading]
  )

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearTimeout()
    }
  }, [clearTimeout])

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    setLoadingMessage,
    clearTimeout,
  }
}

/**
 * Hook for global debounced loading using uiStore
 *
 * This is the recommended pattern for app-wide loading states
 *
 * @param delay - Debounce delay in milliseconds (default: 200)
 * @returns Loading state from uiStore
 */
export function useGlobalDebouncedLoading(delay: number = 200) {
  const { isLoading, loadingMessage, setGlobalLoading } = useUiStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startGlobalLoading = useCallback(
    (message: string, operation?: () => Promise<any>) => {
      // Set message immediately
      setGlobalLoading(true, message)

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set timeout to actually show loading state after delay
      timeoutRef.current = setTimeout(() => {
        // Loading is already shown, just clear the timeout reference
        timeoutRef.current = null
      }, delay)

      // Return operation wrapper
      return async () => {
        try {
          if (operation) {
            const result = await operation()
            setGlobalLoading(false)
            return result
          }
          setGlobalLoading(false)
        } catch (error) {
          setGlobalLoading(false)
          throw error
        }
      }
    },
    [delay, setGlobalLoading]
  )

  const stopGlobalLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setGlobalLoading(false)
  }, [setGlobalLoading])

  return {
    isLoading,
    loadingMessage,
    startGlobalLoading,
    stopGlobalLoading,
  }
}
