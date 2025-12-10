/**
 * TypeScript interfaces for loading state management
 *
 * This module defines comprehensive type definitions for all loading states
 * used throughout the cc-config application.
 */

/// Type discriminator for loading indicators
export type LoadingIndicator = 'skeleton' | 'spinner' | 'progress-bar' | 'overlay'

/// Core loading state interface
export interface LoadingState {
  isLoading: boolean
  loadingMessage: string | null
  isInitialLoading?: boolean
  canCancel?: boolean
}

/// Global loading state for app-wide operations
export interface GlobalLoadingState extends LoadingState {
  isGlobalLoading: boolean
  globalLoadingMessage: string | null
}

/// File operation progress tracking
export interface FileOperationProgress {
  operationId: string
  fileName: string
  operation: 'scan' | 'read' | 'write' | 'delete' | 'copy' | 'move'
  progress: number // 0-100
  totalBytes?: number
  processedBytes?: number
  estimatedTimeRemaining?: number // in seconds
  isIndeterminate?: boolean
}

/// Debounced loading configuration
export interface DebouncedLoadingConfig {
  delay: number // milliseconds
  immediate?: boolean
}

/// Loading hook return type
export interface UseLoadingReturn {
  isLoading: boolean
  loadingMessage: string | null
  startLoading: (message: string, operation?: () => Promise<any>) => Promise<any>
  stopLoading: () => void
  setLoadingMessage: (message: string | null) => void
}

/// File operation progress hook return type
export interface UseFileOperationProgressReturn {
  progress: number | null
  isLoading: boolean
  error: Error | null
  startOperation: (operationId: string, operation: () => Promise<any>) => Promise<any>
  updateProgress: (progress: number) => void
  completeOperation: () => void
  cancelOperation: () => void
}

/// Loading component props
export interface LoadingComponentProps {
  isLoading: boolean
  message?: string | null
  indicator?: LoadingIndicator
  showCancel?: boolean
  onCancel?: () => void
  className?: string
}

/// Skeleton component props
export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  lines?: number
  className?: string
}

/// Configuration list skeleton props
export interface ConfigSkeletonProps {
  count?: number
  showIcons?: boolean
  showBadges?: boolean
}

/// Project card skeleton props
export interface ProjectSkeletonProps {
  count?: number
  layout?: 'grid' | 'list'
}

/// Capability display skeleton props
export interface CapabilitySkeletonProps {
  count?: number
  showDescription?: boolean
}

/// Performance metrics for loading states
export interface LoadingPerformanceMetrics {
  displayLatency: number // milliseconds
  memoryOverhead: number // bytes
  debounceEffectiveness: number // 0-1 (percentage of operations that were debounced)
  cachedVsUncachedRatio: number // 0-1 (percentage of cached operations)
}

/// Loading context for provider
export interface LoadingContextValue {
  globalLoading: GlobalLoadingState
  setGlobalLoading: (loading: boolean, message?: string) => void
  clearGlobalLoading: () => void
}

/// Loading cancellation token
export interface LoadingCancellationToken {
  id: string
  cancel: () => void
  cancelled: boolean
}

/// Loading state history for debugging
export interface LoadingStateHistoryEntry {
  timestamp: number
  operation: string
  duration: number
  indicator: LoadingIndicator
  message: string | null
}

/// Loading statistics
export interface LoadingStats {
  totalOperations: number
  averageDuration: number
  operationsByIndicator: Record<LoadingIndicator, number>
  recentOperations: LoadingStateHistoryEntry[]
}

/// Integration types for error handling (Story 6.1)
export interface LoadingErrorIntegration {
  onError: (error: any) => void
  resetOnError?: boolean
  errorMessage?: string
}

/// Integration types for caching (Story 2.4)
export interface LoadingCacheIntegration {
  cacheKey: string
  cacheDuration: number // milliseconds
  bypassCache?: boolean
  skipLoadingIfCached?: boolean
}

/// Type guard to check if value is a valid LoadingIndicator
export function isLoadingIndicator(value: unknown): value is LoadingIndicator {
  return (
    value === 'skeleton' ||
    value === 'spinner' ||
    value === 'progress-bar' ||
    value === 'overlay'
  )
}

/// Type guard to check if loading state is active
export function isLoadingActive(state: LoadingState): boolean {
  return state.isLoading && !!state.loadingMessage
}

/// Type guard to check if loading can be cancelled
export function canCancelLoading(state: LoadingState): boolean {
  return state.isLoading && !!state.canCancel
}

/// Helper to create initial loading state
export function createInitialLoadingState(): LoadingState {
  return {
    isLoading: false,
    loadingMessage: null,
    isInitialLoading: false,
    canCancel: false,
  }
}

/// Helper to create file operation progress
export function createFileOperationProgress(
  operationId: string,
  fileName: string,
  operation: FileOperationProgress['operation']
): FileOperationProgress {
  return {
    operationId,
    fileName,
    operation,
    progress: 0,
    isIndeterminate: false,
  }
}
