/**
 * File operation progress tracking hook
 *
 * This hook tracks progress for file operations like scanning, reading, writing, etc.
 * It integrates with Tauri file operations to provide accurate progress updates.
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  FileOperationProgress,
  UseFileOperationProgressReturn,
} from '../lib/loadingTypes'
import { useDebouncedLoading } from './useDebouncedLoading'

interface FileOperationOptions {
  operationId: string
  fileName: string
  operation: FileOperationProgress['operation']
  onProgress?: (progress: FileOperationProgress) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

interface UseFileOperationProgressConfig {
  showLoadingAfter?: number // milliseconds (default: 200)
  debounceDelay?: number // milliseconds (default: 200)
}

/**
 * Custom hook for tracking file operation progress
 *
 * @param config - Configuration options
 * @returns Progress state and control functions
 */
export function useFileOperationProgress(
  config: UseFileOperationProgressConfig = {}
): UseFileOperationProgressReturn & {
  startOperation: (options: FileOperationOptions, operation: () => Promise<any>) => Promise<any>
} {
  const { showLoadingAfter = 200, debounceDelay = 200 } = config

  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const operationRef = useRef<{
    id: string
    fileName: string
    operation: FileOperationProgress['operation']
  } | null>(null)

  const { isLoading: isDebouncedLoading, startLoading, stopLoading } =
    useDebouncedLoading({
      delay: debounceDelay,
      onComplete: () => {
        // No-op, completion handled by operation
      },
      onError: (err) => {
        setError(err)
        setIsLoading(false)
      },
    })

  // Update progress
  const updateProgress = useCallback((newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress))
    setProgress(clampedProgress)

    // Call onProgress callback if provided
    if (operationRef.current && config.onProgress) {
      const progressUpdate: FileOperationProgress = {
        operationId: operationRef.current.id,
        fileName: operationRef.current.fileName,
        operation: operationRef.current.operation,
        progress: clampedProgress,
      }
      config.onProgress(progressUpdate)
    }
  }, [config])

  // Complete operation
  const completeOperation = useCallback(() => {
    setProgress(100)
    setIsLoading(false)
    stopLoading()

    if (operationRef.current && config.onComplete) {
      config.onComplete()
    }

    // Reset after a short delay
    setTimeout(() => {
      setProgress(null)
      operationRef.current = null
    }, 500)
  }, [stopLoading, config])

  // Cancel operation
  const cancelOperation = useCallback(() => {
    setProgress(null)
    setIsLoading(false)
    setError(null)
    stopLoading()
    operationRef.current = null
  }, [stopLoading])

  // Start file operation with progress tracking
  const startOperation = useCallback(
    async (
      options: FileOperationOptions,
      operation: () => Promise<any>
    ): Promise<any> => {
      // Store operation details
      operationRef.current = {
        id: options.operationId,
        fileName: options.fileName,
        operation: options.operation,
      }

      setError(null)
      setProgress(0)
      setIsLoading(true)

      try {
        // Use debounced loading to prevent UI flash
        const result = await startLoading(
          `${options.operation} ${options.fileName}...`,
          async () => {
            // Execute the operation
            const operationResult = await operation()
            return operationResult
          }
        )

        // Mark as complete
        completeOperation()

        return result
      } catch (err) {
        // Handle error
        setError(err instanceof Error ? err : new Error('Operation failed'))
        setIsLoading(false)
        stopLoading()

        if (options.onError && err instanceof Error) {
          options.onError(err)
        }

        throw err
      }
    },
    [startLoading, stopLoading, completeOperation]
  )

  return {
    progress,
    isLoading: isLoading || isDebouncedLoading,
    error,
    startOperation,
    updateProgress,
    completeOperation,
    cancelOperation,
  }
}

/**
 * Hook for tracking multiple file operations simultaneously
 */
export function useMultipleFileOperations() {
  const [operations, setOperations] = useState<Map<string, FileOperationProgress>>(
    new Map()
  )

  const addOperation = useCallback((operation: FileOperationProgress) => {
    setOperations((prev) => new Map(prev).set(operation.operationId, operation))
  }, [])

  const updateOperationProgress = useCallback(
    (operationId: string, progress: number) => {
      setOperations((prev) => {
        const newMap = new Map(prev)
        const operation = newMap.get(operationId)
        if (operation) {
          newMap.set(operationId, { ...operation, progress })
        }
        return newMap
      })
    },
    []
  )

  const completeOperation = useCallback((operationId: string) => {
    setOperations((prev) => {
      const newMap = new Map(prev)
      const operation = newMap.get(operationId)
      if (operation) {
        newMap.set(operationId, { ...operation, progress: 100 })
      }
      return newMap
    })

    // Remove after delay
    setTimeout(() => {
      setOperations((prev) => {
        const newMap = new Map(prev)
        newMap.delete(operationId)
        return newMap
      })
    }, 1000)
  }, [])

  const cancelOperation = useCallback((operationId: string) => {
    setOperations((prev) => {
      const newMap = new Map(prev)
      newMap.delete(operationId)
      return newMap
    })
  }, [])

  const clearAllOperations = useCallback(() => {
    setOperations(new Map())
  }, [])

  return {
    operations: Array.from(operations.values()),
    addOperation,
    updateOperationProgress,
    completeOperation,
    cancelOperation,
    clearAllOperations,
  }
}

/**
 * Hook for scanning directory operations with progress
 */
export function useDirectoryScan() {
  const [scannedFiles, setScannedFiles] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)

  const { progress, isLoading, startOperation, updateProgress } =
    useFileOperationProgress()

  const startScan = useCallback(
    async (directoryPath: string, onFileFound?: (file: string) => void) => {
      return startOperation(
        {
          operationId: `scan-${Date.now()}`,
          fileName: directoryPath,
          operation: 'scan',
        },
        async () => {
          // This would integrate with Tauri file system API
          // For now, just simulate progress
          setTotalFiles(100)

          for (let i = 0; i <= 100; i += 10) {
            await new Promise((resolve) => setTimeout(resolve, 50))
            updateProgress(i)
            setScannedFiles(i)

            if (i < 100) {
              setCurrentFile(`file-${i}.txt`)
              if (onFileFound) {
                onFileFound(`file-${i}.txt`)
              }
            }
          }

          setCurrentFile(null)
        }
      )
    },
    [startOperation, updateProgress]
  )

  return {
    progress,
    isLoading,
    scannedFiles,
    totalFiles,
    currentFile,
    startScan,
    updateProgress,
  }
}
