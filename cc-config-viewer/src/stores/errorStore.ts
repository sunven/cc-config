/**
 * Zustand store for error state management
 *
 * This store manages application-wide error state with persistent storage
 * and supports error history tracking (last 100 errors).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppError } from '../lib/errorTypes';

/// Maximum number of errors to store
const MAX_ERROR_HISTORY = 100;

/// Error with timestamp for tracking
export interface TimestampedError extends AppError {
  timestamp: number;
  id: string;
}

/// Error statistics
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: number; // errors in last hour
}

/// Error store interface
interface ErrorStore {
  // State
  errors: TimestampedError[];
  isRetrying: boolean;
  lastError?: TimestampedError;

  // Actions
  addError: (error: AppError) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;
  clearErrorsByType: (type: AppError['type']) => void;
  setRetrying: (retrying: boolean) => void;
  retryLastError: () => void;

  // Utility actions
  getErrorStats: () => ErrorStats;
  getErrorsByType: (type: AppError['type']) => TimestampedError[];
  getRecentErrors: (hours?: number) => TimestampedError[];
  hasError: (type: AppError['type']) => boolean;
  getErrorCount: (type?: AppError['type']) => number;

  // Persistence actions
  exportErrors: () => string;
  importErrors: (errorsJson: string) => void;
}

/// Generate unique ID for error
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/// Create timestamped error from AppError
const createTimestampedError = (error: AppError): TimestampedError => {
  return {
    ...error,
    timestamp: Date.now(),
    id: generateErrorId(),
  };
};

/// Check if error is from last hour
const isRecentError = (timestamp: number, hours: number = 1): boolean => {
  const oneHourMs = hours * 60 * 60 * 1000;
  return Date.now() - timestamp < oneHourMs;
};

export const useErrorStore = create<ErrorStore>()(
  persist(
    (set, get) => ({
      // Initial state
      errors: [],
      isRetrying: false,

      // Add a new error
      addError: (error: AppError) => {
        const timestampedError = createTimestampedError(error);

        set((state) => {
          // Add new error to the beginning of the array
          const newErrors = [timestampedError, ...state.errors];

          // Keep only the last MAX_ERROR_HISTORY errors
          const trimmedErrors = newErrors.slice(0, MAX_ERROR_HISTORY);

          return {
            errors: trimmedErrors,
            lastError: timestampedError,
          };
        });
      },

      // Remove error by index
      removeError: (index: number) => {
        set((state) => {
          const newErrors = [...state.errors];
          if (index >= 0 && index < newErrors.length) {
            newErrors.splice(index, 1);
          }
          return {
            errors: newErrors,
            lastError: newErrors.length > 0 ? newErrors[0] : undefined,
          };
        });
      },

      // Clear all errors
      clearErrors: () => {
        set({
          errors: [],
          lastError: undefined,
        });
      },

      // Clear errors by type
      clearErrorsByType: (type: AppError['type']) => {
        set((state) => {
          const filteredErrors = state.errors.filter((error) => error.type !== type);
          return {
            errors: filteredErrors,
            lastError: filteredErrors.length > 0 ? filteredErrors[0] : undefined,
          };
        });
      },

      // Set retrying state
      setRetrying: (retrying: boolean) => {
        set({ isRetrying: retrying });
      },

      // Retry the last error
      retryLastError: () => {
        const { lastError, setRetrying } = get();
        if (lastError && lastError.recoverable) {
          setRetrying(true);
          // In a real implementation, this would trigger the actual retry logic
          // For now, we just reset the retrying state after a delay
          setTimeout(() => setRetrying(false), 1000);
        }
      },

      // Get error statistics
      getErrorStats: (): ErrorStats => {
        const { errors } = get();

        // Count errors by type
        const errorsByType: Record<string, number> = {};
        let recentErrors = 0;

        errors.forEach((error) => {
          errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
          if (isRecentError(error.timestamp)) {
            recentErrors++;
          }
        });

        return {
          totalErrors: errors.length,
          errorsByType,
          recentErrors,
        };
      },

      // Get errors by type
      getErrorsByType: (type: AppError['type']): TimestampedError[] => {
        const { errors } = get();
        return errors.filter((error) => error.type === type);
      },

      // Get recent errors
      getRecentErrors: (hours: number = 1): TimestampedError[] => {
        const { errors } = get();
        return errors.filter((error) => isRecentError(error.timestamp, hours));
      },

      // Check if store has errors of a specific type
      hasError: (type: AppError['type']): boolean => {
        const { errors } = get();
        return errors.some((error) => error.type === type);
      },

      // Get error count (optionally filtered by type)
      getErrorCount: (type?: AppError['type']): number => {
        const { errors } = get();
        if (!type) {
          return errors.length;
        }
        return errors.filter((error) => error.type === type).length;
      },

      // Export errors as JSON string
      exportErrors: (): string => {
        const { errors } = get();
        return JSON.stringify(errors, null, 2);
      },

      // Import errors from JSON string
      importErrors: (errorsJson: string) => {
        try {
          const importedErrors: TimestampedError[] = JSON.parse(errorsJson);

          // Validate imported errors
          const validErrors = importedErrors.filter((error) => {
            return (
              error &&
              typeof error === 'object' &&
              'type' in error &&
              'message' in error &&
              'recoverable' in error &&
              'timestamp' in error &&
              'id' in error
            );
          });

          set({ errors: validErrors.slice(0, MAX_ERROR_HISTORY) });
        } catch (error) {
          console.error('Failed to import errors:', error);
          throw new Error('Invalid error data format');
        }
      },
    }),
    {
      // Configure persistence
      name: 'cc-config-error-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential error data
      partialize: (state) => ({
        errors: state.errors,
        lastError: state.lastError,
      }),
      // Version for migration handling
      version: 1,
    }
  )
);

/// Hook for accessing error store with additional utilities
export const useErrorStoreEnhanced = () => {
  const store = useErrorStore();

  // Get latest errors (last 10)
  const getLatestErrors = () => {
    return store.errors.slice(0, 10);
  };

  // Check if there are any errors
  const hasErrors = () => {
    return store.errors.length > 0;
  };

  // Get critical errors (non-recoverable)
  const getCriticalErrors = () => {
    return store.errors.filter((error) => !error.recoverable);
  };

  // Get recoverable errors
  const getRecoverableErrors = () => {
    return store.errors.filter((error) => error.recoverable);
  };

  return {
    ...store,
    getLatestErrors,
    hasErrors,
    getCriticalErrors,
    getRecoverableErrors,
  };
};

/// Selector hooks for specific error types
export const useFilesystemErrors = () => {
  return useErrorStore((state) => state.errors.filter((e) => e.type === 'filesystem'));
};

export const usePermissionErrors = () => {
  return useErrorStore((state) => state.errors.filter((e) => e.type === 'permission'));
};

export const useParseErrors = () => {
  return useErrorStore((state) => state.errors.filter((e) => e.type === 'parse'));
};

export const useNetworkErrors = () => {
  return useErrorStore((state) => state.errors.filter((e) => e.type === 'network'));
};

/// Hook for error statistics
export const useErrorStats = () => {
  const errors = useErrorStore((state) => state.errors);
  const errorsByType: Record<string, number> = {};
  let recentErrors = 0;
  const oneHourMs = 60 * 60 * 1000;

  errors.forEach((error) => {
    errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    if (Date.now() - error.timestamp < oneHourMs) {
      recentErrors++;
    }
  });

  return {
    totalErrors: errors.length,
    errorsByType,
    recentErrors,
  };
};
