/**
 * Error handling hooks for comprehensive error management
 *
 * This module provides React hooks for error handling, retry logic,
 * and error display integration with the error store.
 */

import { useCallback, useRef, useState } from 'react';
import { useErrorStore } from '../stores/errorStore';
import { AppError, fromRustError, isRecoverableError } from '../lib/errorTypes';
import { getErrorMessage, canRetryError, getRetrySuggestion } from '../lib/errorMessages';

/// Configuration for retry behavior
interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Hook for handling errors with the error store
 */
export function useErrorHandler() {
  const { addError, clearErrors, clearErrorsByType, lastError, errors, isRetrying, setRetrying } =
    useErrorStore();

  /**
   * Handle an error by adding it to the store
   */
  const handleError = useCallback(
    (error: unknown, context?: string): AppError => {
      let appError: AppError;

      if (typeof error === 'object' && error !== null && 'type' in error) {
        // Already an AppError
        appError = error as AppError;
      } else if (typeof error === 'string') {
        // Try to parse as Rust error
        try {
          appError = fromRustError(error);
        } catch {
          // Plain string error
          appError = {
            type: 'filesystem',
            message: error,
            recoverable: false,
          };
        }
      } else if (error instanceof Error) {
        // JavaScript Error object
        appError = {
          type: 'filesystem',
          message: error.message,
          recoverable: false,
          details: { stack: error.stack, name: error.name },
        };
      } else {
        // Unknown error type
        appError = {
          type: 'filesystem',
          message: context || 'An unknown error occurred',
          recoverable: false,
        };
      }

      // Add context if provided
      if (context && !appError.message?.includes(context)) {
        appError = {
          ...appError,
          message: `${context}: ${appError.message || 'Unknown error'}`,
        };
      }

      addError(appError);
      return appError;
    },
    [addError]
  );

  /**
   * Handle a Rust/Tauri error
   */
  const handleRustError = useCallback(
    (rustError: unknown): AppError => {
      const appError = fromRustError(rustError);
      addError(appError);
      return appError;
    },
    [addError]
  );

  /**
   * Clear all errors (legacy compatibility)
   */
  const clearAllErrors = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  /**
   * Clear a specific error by index (legacy compatibility)
   */
  const clearError = useCallback(
    (index: number) => {
      const store = useErrorStore.getState();
      store.removeError(index);
    },
    []
  );

  /**
   * Clear errors of a specific type
   */
  const dismissErrorsByType = useCallback(
    (type: AppError['type']) => {
      clearErrorsByType(type);
    },
    [clearErrorsByType]
  );

  /**
   * Get formatted error message for display
   */
  const getFormattedError = useCallback((error: AppError) => {
    return getErrorMessage(error);
  }, []);

  /**
   * Check if an error can be retried
   */
  const canRetry = useCallback((error: AppError) => {
    return canRetryError(error);
  }, []);

  /**
   * Get retry suggestion for an error
   */
  const getRetryHint = useCallback((error: AppError) => {
    return getRetrySuggestion(error);
  }, []);

  return {
    // State
    errors,
    lastError,
    isRetrying,
    hasErrors: errors.length > 0,

    // Actions
    handleError,
    handleRustError,
    clearError,
    clearAllErrors,
    dismissErrorsByType,
    setRetrying,

    // Utilities
    getFormattedError,
    canRetry,
    getRetryHint,
  };
}

/**
 * Hook for executing async operations with automatic error handling and retry
 */
export function useAsyncWithRetry<T>(
  asyncFn: () => Promise<T>,
  config: RetryConfig = {}
): {
  execute: () => Promise<T | undefined>;
  isLoading: boolean;
  retryCount: number;
  reset: () => void;
} {
  const { handleError, setRetrying } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef(false);

  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  const calculateDelay = useCallback(
    (attempt: number): number => {
      const delay = mergedConfig.initialDelayMs * Math.pow(mergedConfig.backoffMultiplier, attempt);
      return Math.min(delay, mergedConfig.maxDelayMs);
    },
    [mergedConfig.initialDelayMs, mergedConfig.backoffMultiplier, mergedConfig.maxDelayMs]
  );

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  const execute = useCallback(async (): Promise<T | undefined> => {
    setIsLoading(true);
    setRetryCount(0);
    abortRef.current = false;
    let currentRetry = 0;

    while (currentRetry <= mergedConfig.maxRetries && !abortRef.current) {
      try {
        const result = await asyncFn();
        setIsLoading(false);
        return result;
      } catch (error) {
        const appError = handleError(error);

        if (!isRecoverableError(appError) || currentRetry >= mergedConfig.maxRetries) {
          setIsLoading(false);
          return undefined;
        }

        // Wait before retrying with exponential backoff
        setRetrying(true);
        const delay = calculateDelay(currentRetry);
        await sleep(delay);
        setRetrying(false);

        currentRetry++;
        setRetryCount(currentRetry);
      }
    }

    setIsLoading(false);
    return undefined;
  }, [asyncFn, mergedConfig.maxRetries, handleError, setRetrying, calculateDelay, sleep]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setRetryCount(0);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    retryCount,
    reset,
  };
}

/**
 * Hook for wrapping async operations with error handling
 */
export function useErrorBoundaryHandler() {
  const { handleError } = useErrorHandler();

  /**
   * Wrap an async function with error handling
   */
  const wrapAsync = useCallback(
    <T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>) => {
      return async (...args: Args): Promise<T | undefined> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error);
          return undefined;
        }
      };
    },
    [handleError]
  );

  /**
   * Wrap a sync function with error handling
   */
  const wrapSync = useCallback(
    <T, Args extends unknown[]>(fn: (...args: Args) => T) => {
      return (...args: Args): T | undefined => {
        try {
          return fn(...args);
        } catch (error) {
          handleError(error);
          return undefined;
        }
      };
    },
    [handleError]
  );

  return {
    wrapAsync,
    wrapSync,
  };
}
