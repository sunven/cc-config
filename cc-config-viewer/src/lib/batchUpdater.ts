/**
 * Batch Update Utility
 *
 * Provides debounced batching for rapid state updates to prevent
 * excessive re-renders during frequent store operations.
 */

type UpdateCallback<T> = (updates: T[]) => void

interface BatchUpdater<T> {
  add: (update: T) => void
  flush: () => void
  cancel: () => void
}

/**
 * Creates a batch updater that collects updates and processes them together
 * after a debounce period.
 *
 * @param callback - Function to call with batched updates
 * @param debounceMs - Milliseconds to wait before flushing (default: 16ms for ~60fps)
 * @param maxBatchSize - Maximum items before forcing flush (default: 100)
 */
export function createBatchUpdater<T>(
  callback: UpdateCallback<T>,
  debounceMs: number = 16,
  maxBatchSize: number = 100
): BatchUpdater<T> {
  let pendingUpdates: T[] = []
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (pendingUpdates.length > 0) {
      const updates = [...pendingUpdates]
      pendingUpdates = []
      callback(updates)
    }
  }

  const scheduleFlush = () => {
    if (!timeoutId) {
      timeoutId = setTimeout(flush, debounceMs)
    }
  }

  return {
    add: (update: T) => {
      pendingUpdates.push(update)
      if (pendingUpdates.length >= maxBatchSize) {
        flush()
      } else {
        scheduleFlush()
      }
    },
    flush,
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      pendingUpdates = []
    }
  }
}

/**
 * Creates a debounced function that only executes after
 * the specified delay has passed since the last call.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const debouncedFn = ((...args: Parameters<T>) => {
    lastArgs = args
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs)
        lastArgs = null
      }
      timeoutId = null
    }, delay)
  }) as T & { cancel: () => void; flush: () => void }

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  debouncedFn.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (lastArgs) {
      fn(...lastArgs)
      lastArgs = null
    }
  }

  return debouncedFn
}

/**
 * Creates a throttled function that executes at most once
 * per specified time period.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T & { cancel: () => void } {
  let lastRan = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttledFn = ((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastRan >= limit) {
      fn(...args)
      lastRan = now
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        fn(...args)
        lastRan = Date.now()
        timeoutId = null
      }, limit - (now - lastRan))
    }
  }) as T & { cancel: () => void }

  throttledFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return throttledFn
}

// Global store update batcher for rapid config changes
let storeUpdateBatcher: BatchUpdater<() => void> | null = null

/**
 * Gets or creates the global store update batcher
 */
export function getStoreUpdateBatcher(): BatchUpdater<() => void> {
  if (!storeUpdateBatcher) {
    storeUpdateBatcher = createBatchUpdater<() => void>(
      (updates) => {
        // Execute all batched updates together
        updates.forEach(update => update())
      },
      16, // ~60fps batching
      50  // Max 50 updates per batch
    )
  }
  return storeUpdateBatcher
}
