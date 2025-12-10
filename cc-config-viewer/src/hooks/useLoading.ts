/**
 * Main loading hook - wrapper for common loading patterns
 *
 * This is the primary hook for managing loading states throughout the application.
 * It provides a unified interface for local, global, and file operation loading.
 */

import React, { useState, useCallback } from 'react'
import { useUiStore } from '../stores/uiStore'
import { useDebouncedLoading } from './useDebouncedLoading'
import { useFileOperationProgress } from './useFileOperationProgress'
import {
  LoadingState,
  GlobalLoadingState,
  LoadingIndicator,
  UseLoadingReturn,
} from '../lib/loadingTypes'
import { getLoadingMessage, LOADING_MESSAGES } from '../lib/loadingMessages'

interface UseLoadingConfig {
  type?: 'local' | 'global' | 'file'
  delay?: number
  message?: string
  onComplete?: () => void
  onError?: (error: Error) => void
}

/**
 * Primary loading hook - unified interface for all loading patterns
 *
 * @param config - Configuration for the loading hook
 * @returns Loading state and control functions
 */
export function useLoading(config: UseLoadingConfig = {}): UseLoadingReturn {
  const { type = 'local', delay = 200, message, onComplete, onError } = config

  // Local loading state
  const [localLoading, setLocalLoading] = useState(false)
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  // Global loading from uiStore
  const { isLoading: globalLoading, loadingMessage: globalMessage, setGlobalLoading } = useUiStore()

  // File operation progress
  const { progress, isLoading: fileLoading } = useFileOperationProgress()

  // Debounced loading for local operations
  const {
    isLoading: debouncedLoading,
    loadingMessage: debouncedMessage,
    startLoading,
    stopLoading,
  } = useDebouncedLoading({
    delay,
    onComplete,
    onError,
  })

  // Determine current loading state based on type
  const isLoading = (() => {
    switch (type) {
      case 'global':
        return globalLoading
      case 'file':
        return fileLoading
      case 'local':
      default:
        return localLoading || debouncedLoading
    }
  })()

  // Determine current message based on type
  const loadingMessage = (() => {
    switch (type) {
      case 'global':
        return globalMessage
      case 'file':
        return progress !== null ? `Progress: ${progress}%` : null
      case 'local':
      default:
        return localMessage || debouncedMessage || message
    }
  })()

  // Start loading with appropriate type
  const startLoadingWrapped = useCallback(
    async (loadingMessage?: string, operation?: () => Promise<any>) => {
      const msg = loadingMessage || message || 'Loading...'

      switch (type) {
        case 'global':
          setGlobalLoading(true, msg)
          if (operation) {
            try {
              const result = await operation()
              setGlobalLoading(false)
              return result
            } catch (error) {
              setGlobalLoading(false)
              throw error
            }
          }
          break

        case 'file':
          // File operations use their own progress tracking
          if (operation) {
            return operation()
          }
          break

        case 'local':
        default:
          setLocalLoading(true)
          setLocalMessage(msg)
          return startLoading(msg, operation)
      }
    },
    [type, message, setGlobalLoading, startLoading]
  )

  // Stop loading with appropriate type
  const stopLoadingWrapped = useCallback(() => {
    switch (type) {
      case 'global':
        setGlobalLoading(false)
        break

      case 'file':
        // File operations manage their own stopping
        break

      case 'local':
      default:
        setLocalLoading(false)
        setLocalMessage(null)
        stopLoading()
        break
    }
  }, [type, setGlobalLoading, stopLoading])

  // Set message
  const setLoadingMessageWrapped = useCallback(
    (msg: string | null) => {
      switch (type) {
        case 'global':
          setGlobalLoading(isLoading, msg || undefined)
          break

        case 'file':
          // File operations use progress, not messages
          break

        case 'local':
        default:
          setLocalMessage(msg)
          break
      }
    },
    [type, isLoading, setGlobalLoading]
  )

  return {
    isLoading,
    loadingMessage,
    startLoading: startLoadingWrapped,
    stopLoading: stopLoadingWrapped,
    setLoadingMessage: setLoadingMessageWrapped,
  }
}

/**
 * Hook for local component-specific loading
 */
export function useLocalLoading(
  delay: number = 200,
  onComplete?: () => void,
  onError?: (error: Error) => void
) {
  return useLoading({
    type: 'local',
    delay,
    onComplete,
    onError,
  })
}

/**
 * Hook for global application-wide loading
 */
export function useGlobalLoading() {
  const { isLoading, loadingMessage, setGlobalLoading } = useUiStore()

  const startGlobalLoading = useCallback(
    async (message: string, operation?: () => Promise<any>) => {
      setGlobalLoading(true, message)
      if (operation) {
        try {
          const result = await operation()
          setGlobalLoading(false)
          return result
        } catch (error) {
          setGlobalLoading(false)
          throw error
        }
      }
    },
    [setGlobalLoading]
  )

  const stopGlobalLoading = useCallback(() => {
    setGlobalLoading(false)
  }, [setGlobalLoading])

  return {
    isLoading,
    loadingMessage,
    startGlobalLoading,
    stopGlobalLoading,
    setGlobalLoading,
  }
}

/**
 * Hook for quick loading operations (spinner pattern)
 * Use for operations <1s that need immediate feedback
 */
export function useQuickLoading(message: string = 'Loading...') {
  const { isLoading, loadingMessage, startLoading, stopLoading, setLoadingMessage } =
    useLoading({
      type: 'local',
      delay: 0, // No debouncing for quick operations
    })

  const startQuickLoading = useCallback(
    async (operation?: () => Promise<any>) => {
      return startLoading(message, operation)
    },
    [message, startLoading]
  )

  return {
    isLoading,
    loadingMessage,
    startQuickLoading,
    stopLoading,
    setLoadingMessage,
  }
}

/**
 * Hook for skeleton loading (content pattern)
 * Use for content loading >1s with skeleton screens
 */
export function useSkeletonLoading(
  message: string = LOADING_MESSAGES.LOADING_DATA,
  delay: number = 1000
) {
  return useLoading({
    type: 'local',
    delay,
    message,
  })
}

/**
 * Hook for progress bar loading (file operations)
 * Use for operations with known duration
 */
export function useProgressLoading() {
  const { progress, isLoading, startOperation, updateProgress, completeOperation } =
    useFileOperationProgress()

  const startProgressLoading = useCallback(
    async (
      operationId: string,
      fileName: string,
      operationType: 'scan' | 'read' | 'write' | 'delete' | 'copy' | 'move',
      operation: () => Promise<any>
    ) => {
      return startOperation(
        {
          operationId,
          fileName,
          operation: operationType,
        },
        operation
      )
    },
    [startOperation]
  )

  return {
    progress,
    isLoading,
    startProgressLoading,
    updateProgress,
    completeOperation,
  }
}

/**
 * Hook for async operations with automatic loading state
 * This is the most common pattern for API calls
 */
export function useAsyncLoading(
  loadingMessage: string = LOADING_MESSAGES.LOADING,
  delay: number = 200
) {
  const { isLoading, loadingMessage: msg, startLoading } = useLoading({
    type: 'local',
    delay,
    message: loadingMessage,
  })

  const executeAsync = useCallback(
    async <T>(asyncOperation: () => Promise<T>): Promise<T> => {
      return startLoading(loadingMessage, asyncOperation) as Promise<T>
    },
    [loadingMessage, startLoading]
  )

  return {
    isLoading,
    loadingMessage: msg,
    executeAsync,
  }
}

/**
 * Hook for conditional loading based on data presence
 * Automatically shows loading when data is being fetched
 */
export function useConditionalLoading<T>(
  data: T | null | undefined,
  loadingMessage: string = LOADING_MESSAGES.LOADING_DATA,
  delay: number = 200
) {
  const { isLoading, loadingMessage: msg, startLoading } = useLoading({
    type: 'local',
    delay,
    message: loadingMessage,
  })

  const shouldShowLoading = !data && isLoading

  return {
    isLoading,
    loadingMessage: msg,
    shouldShowLoading,
    startLoading,
  }
}

/**
 * Hook for error handling integration (Story 6.1)
 * Automatically resets loading state on error
 */
export function useLoadingWithErrorHandling(
  loadingMessage: string,
  onError?: (error: Error) => void
) {
  const { isLoading, loadingMessage: msg, startLoading, stopLoading } = useLoading({
    type: 'local',
    message: loadingMessage,
    onError: (error) => {
      stopLoading() // Reset loading state on error
      if (onError) {
        onError(error)
      }
    },
  })

  return {
    isLoading,
    loadingMessage: msg,
    startLoading,
    stopLoading,
  }
}
